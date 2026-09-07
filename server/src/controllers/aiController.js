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
Investment focus: ${investorProfile?.focus?.join(", ") || "All sectors"}
Investment range: ${investorProfile?.investmentRange || "Not specified"}
Organization: ${investorProfile?.organization || "Not specified"}

Given the startups below, rank them from most to least aligned with the investor's criteria.
For each startup, provide:
- Rank number
- Name
- Score (1-100)
- 2-3 sentence reasoning

${startupTexts}

Return as a JSON array with objects: { rank, name, score, reason }
    `;

    const raw = await generateContent(prompt);

    let parsed;
    try {
      const jsonStart = raw.indexOf("[");
      const jsonEnd = raw.lastIndexOf("]");
      const jsonStr = raw.slice(jsonStart, jsonEnd + 1);
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = [{ rank: 1, name: "AI response", score: 0, reason: raw }];
    }

    res.status(200).json({ success: true, data: parsed });
  } catch (error) {
    console.error("Analyze opportunities error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};
