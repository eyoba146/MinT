async function generateContent(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      signal: controller.signal,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Gemini REST error:", data);
      throw new Error(
        "AI service failed: " + (data.error?.message || res.statusText),
      );
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("AI returned no text");
    return text;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("AI service timed out after 30 seconds");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildFallbackRanking(startups, investorProfile = {}) {
  const focus = (Array.isArray(investorProfile.focus) ? investorProfile.focus : [])
    .map((sector) => String(sector).trim().toLowerCase())
    .filter(Boolean);

  return startups
    .map((startup) => {
      const name = startup.companyName || startup.name || "Unnamed startup";
      const sector = String(startup.sector || "Unknown");
      const description = String(
        startup.innovationDescription || startup.description || "",
      );
      const normalizedSector = sector.toLowerCase();
      const normalizedDescription = description.toLowerCase();
      const sectorMatch = focus.some(
        (item) =>
          normalizedSector === item ||
          normalizedSector.includes(item) ||
          item.includes(normalizedSector),
      );
      const descriptionMatch = focus.some((item) =>
        normalizedDescription.includes(item),
      );
      const score = sectorMatch ? 90 : descriptionMatch ? 70 : focus.length ? 30 : 50;

      return {
        id: startup.id || startup._id || null,
        name,
        score,
        reason: focus.length
          ? sectorMatch
            ? `${sector} directly matches your selected focus sectors: ${focus.join(", ")}.`
            : descriptionMatch
              ? `The startup description relates to your selected focus sectors, although its listed sector is ${sector}.`
              : `The startup is in ${sector}, outside your selected focus sectors: ${focus.join(", ")}.`
          : "No focus sectors were provided, so this startup is included as a general match.",
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

exports.polishText = async (req, res) => {
  try {
    const { text, mode = "enhance" } = req.body;

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Text is required" });
    }

    const prompt = `
You are an expert writing assistant for Ethiopian startup founders and investors.
${mode === "grammar" ? "Correct grammar and punctuation only." : mode === "concise" ? "Make this more concise while preserving meaning." : "Improve clarity, tone, and professionalism."}
Return only the improved text, no explanations.

Original text:
${text.trim()}
    `;

    const improved = await generateContent(prompt);

    res.status(200).json({
      success: true,
      data: { improved: improved.trim() },
    });
  } catch (error) {
    console.error("Polish text error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

exports.analyzeOpportunities = async (req, res) => {
  try {
    const { startups, investorProfile } = req.body;

    if (!Array.isArray(startups) || startups.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Startups array required" });
    }

    const startupTexts = startups
      .map(
        (s, i) => `
Startup ${i + 1}:
ID: ${s.id || s._id || "unknown"}
Name: ${s.companyName || s.name}
Sector: ${s.sector || "Unknown"}
Description: ${s.innovationDescription || s.description || "No description"}
Funding Stage: ${s.fundingStage || "Unknown"}
Location: ${s.location || s.country || "Unknown"}
`,
      )
      .join("\n");

    const prompt = `
You are an AI investment analyst at the Ethiopian Ministry of Innovation and Technology.
An investor with the following profile is browsing designated startups:
Investment focus: ${Array.isArray(investorProfile?.focus) && investorProfile.focus.length ? investorProfile.focus.join(", ") : "All sectors"}
Investment range: ${investorProfile?.investmentRange || "Not specified"}
Organization: ${investorProfile?.organization || "Not specified"}

Given the startups below, rank them from most to least aligned with the investor's criteria.
Use sector focus as the strongest signal. Use the investment range and startup stage as
secondary context, but do not invent funding amounts that are not provided.
Only return genuine matches with a score of 60 or higher. Omit weak or unrelated startups.
For each startup, provide:
- Rank number
- The exact startup ID supplied above
- Name
- Score (1-100)
- 2-3 sentence reasoning

${startupTexts}

Return only valid JSON, as an array of objects with exactly this shape:
[{ "rank": 1, "id": "startup-id", "name": "Startup name", "score": 85, "reason": "..." }]
    `;

    let parsed;
    let source = "ai";
    try {
      const raw = await generateContent(prompt);
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const jsonStart = cleaned.indexOf("[");
      const jsonEnd = cleaned.lastIndexOf("]");
      const jsonStr = cleaned.slice(jsonStart, jsonEnd + 1);
      parsed = JSON.parse(jsonStr)
        .filter((item) => item && item.name)
        .map((item, index) => ({
          rank: Number(item.rank) || index + 1,
          id: item.id || null,
          name: String(item.name),
          score: Math.max(0, Math.min(100, Number(item.score) || 0)),
          reason: String(item.reason || "No explanation provided."),
        }));
    } catch (error) {
      if (
        !/quota exceeded|rate limit|429/i.test(error.message || "") &&
        !(error instanceof SyntaxError)
      ) {
        throw error;
      }
      console.warn("Gemini quota exhausted; using local startup ranking.");
      parsed = buildFallbackRanking(startups, investorProfile);
      source = "local-fallback";
    }

    res.status(200).json({
      success: true,
      data: parsed,
      meta: { source },
    });
  } catch (error) {
    console.error("Analyze opportunities error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};
