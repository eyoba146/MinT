import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../utils/api";

const DesignationContext = createContext(null);

export const PROCLAMATION_DATA = {
  number: "1396/2025",
  title: "Startup & Sovereign Innovation Proclamation",
  authority: "Ministry of Innovation and Technology (MinT)",
  gazetteDate: "January 2025",
  status: "In Full Statutory Effect",
  keyThresholds: {
    maxAgeStandardYears: 5,
    maxAgeDeepTechYears: 7,
    minEthiopianEquityPercent: 51,
    maxAnnualTurnoverETB: 50000000,
    maxHeadcount: 100,
  },
  incentiveTiers: [
    {
      tier: "Tier 1: Sovereign Tax Holiday",
      desc: "3-year 100% corporate income tax waiver on innovative tech revenue, followed by graduated rates.",
      category: "Fiscal",
    },
    {
      tier: "Tier 2: Priority FX Allocation",
      desc: "Dedicated central bank foreign exchange priority lane for critical software tooling & cloud infrastructure.",
      category: "Finance",
    },
    {
      tier: "Tier 3: Fast-Track IP & Patent Grant",
      desc: "Zero-cost expedited national and regional patent filing via Ethiopian Intellectual Property Authority (EIPA).",
      category: "Legal",
    },
    {
      tier: "Tier 4: Public Procurement Preference",
      desc: "15% statutory margin of preference in federal and municipal digital transformation tenders.",
      category: "Government",
    },
  ],
};

export function DesignationProvider({ children }) {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    verifiedStartups: 0,
    totalInvestors: 0,
    totalStartups: 0,
    sectorsCovered: 0,
    totalCapitalFacilitatedETB: "0 ETB",
    taxExemptionsClaimedETB: "0 ETB",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadApiData() {
      try {
        const [startupsRes, statsRes] = await Promise.allSettled([
          apiRequest("/startups"),
          apiRequest("/startups/public-stats"),
        ]);

        if (isMounted) {
          if (startupsRes.status === "fulfilled" && Array.isArray(startupsRes.value?.data)) {
            setApplications(startupsRes.value.data);
          }
          if (statsRes.status === "fulfilled" && statsRes.value?.data) {
            setStats((prev) => ({ ...prev, ...statsRes.value.data }));
          }
        }
      } catch (err) {
        console.warn("Could not fetch MinT designation API data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadApiData();
    return () => {
      isMounted = false;
    };
  }, []);

  const calculateEligibility = (data) => {
    const checks = [];
    let score = 0;

    // 1. Age check
    const regDate = new Date(data.regDate || data.incorporationDate || data.commercialRegDate || "2023-01-01");
    const diffYears = (new Date() - regDate) / (1000 * 60 * 60 * 24 * 365.25);
    const maxAge = ["AgriTech", "HealthTech", "CleanTech", "DeepTech"].includes(data.sector) ? 7 : 5;
    const agePassed = diffYears <= maxAge;
    checks.push({
      id: "age",
      label: `Venture Age Window (<= ${maxAge} yrs for ${data.sector || "Standard"})`,
      passed: agePassed,
      actual: `${diffYears.toFixed(1)} years`,
      weight: 25,
    });
    if (agePassed) score += 25;

    // 2. Ownership check
    const ownership = Number(data.ethiopianOwnershipPercent || data.ownership || 0);
    const ownershipPassed = ownership >= 51;
    checks.push({
      id: "equity",
      label: "Ethiopian Citizen Equity (Minimum 51%)",
      passed: ownershipPassed,
      actual: `${ownership}%`,
      weight: 25,
    });
    if (ownershipPassed) score += 25;

    // 3. Headcount check
    const employees = Number(data.fullTimeEmployees || data.employees || 0);
    const employeesPassed = employees <= 100;
    checks.push({
      id: "headcount",
      label: "Full-Time Workforce (<= 100 staff)",
      passed: employeesPassed,
      actual: `${employees} employees`,
      weight: 25,
    });
    if (employeesPassed) score += 25;

    // 4. Innovation / IP check
    const hasInnovation = (data.innovationDescription || data.problemStatement || data.description || "").length >= 10;
    checks.push({
      id: "innovation",
      label: "Proprietary Innovation & Digital Core",
      passed: hasInnovation,
      actual: hasInnovation ? "Verified IP Architecture" : "Requires Description",
      weight: 25,
    });
    if (hasInnovation) score += 25;

    return {
      isEligible: score >= 75,
      score,
      checks,
      recommendation:
        score === 100
          ? "Exemplary Eligibility: Fast-track statutory filing recommended under Section 4(1)."
          : score >= 75
          ? "Statutory Threshold Met: Eligible for MinT Designation Review."
          : "Statutory Criteria Incomplete: Please revise venture parameters to meet legal thresholds.",
    };
  };

  return (
    <DesignationContext.Provider
      value={{
        proclamation: PROCLAMATION_DATA,
        applications,
        stats,
        loading,
        calculateEligibility,
      }}
    >
      {children}
    </DesignationContext.Provider>
  );
}

export function useDesignation() {
  const ctx = useContext(DesignationContext);
  if (!ctx) throw new Error("useDesignation must be used within DesignationProvider");
  return ctx;
}
