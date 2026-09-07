import { apiRequest } from "./api";

export function toAiStartup(startup) {
  return {
    id: startup._id || startup.id,
    companyName:
      startup.companyName || startup.legalName || startup.name || "Unnamed startup",
    sector: startup.sector || "Unknown",
    description:
      startup.innovationDescription ||
      startup.oneLineDescription ||
      startup.description ||
      "No description",
    fundingStage: startup.fundingStage || startup.stage || "Unknown",
    location: startup.location || startup.country || "Unknown",
  };
}

export async function getAiRecommendations(startups, user) {
  const response = await apiRequest("/ai/analyze", {
    method: "POST",
    body: {
      startups: startups.map(toAiStartup),
      investorProfile: {
        focus: Array.isArray(user?.focus) ? user.focus : [],
        investmentRange: user?.investmentRange || "",
        organization:
          user?.organization || user?.organizationName || user?.companyName || "",
      },
    },
  });

  return Array.isArray(response.data) ? response.data : [];
}
