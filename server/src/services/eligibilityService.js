/**
 * Eligibility checks based on Ethiopian Startup Proclamation No. 1396/2025.
 * Server-side only — API never trusts frontend forms alone.
 */

function yearsBetween(fromDate, toDate = new Date()) {
  if (!fromDate) return null;
  const from = new Date(fromDate);
  if (Number.isNaN(from.getTime())) return null;
  const ms = toDate.getTime() - from.getTime();
  return ms / (1000 * 60 * 60 * 24 * 365.25);
}

function isNonEmptyString(val, minLen = 5) {
  return typeof val === "string" && val.trim().length >= minLen;
}

/**
 * @param {Object} data - startup payload or document
 * @param {Object} options
 * @param {boolean} options.strict - if true, missing required legal fields fail hard
 * @returns {{ ok: boolean, errors: string[], warnings: string[], checks: Object }}
 */
function evaluateStartupEligibility(data = {}, options = {}) {
  const strict = options.strict === true;
  const errors = [];
  const warnings = [];

  const ownership = data.founderOwnershipPercent;
  const isPublicCompany = data.isPublicCompany === true;
  const hasLicense = data.hasBusinessLicense === true;
  const dateEstablished = data.dateEstablished || null;
  const ownershipDeclared = data.productOwnershipDeclaration === true;
  const affidavitUrl = data.affidavitUrl || null;

  // Article 7 definitional fields
  const description = (data.description || "").trim();
  const problemStatement = (data.problemStatement || "").trim();
  const solutionStatement = (data.solutionStatement || "").trim();
  const innovationDesc = (data.innovationDescription || "").trim();
  const techEnabledDesc = (data.techEnabledDescription || "").trim();
  const scalabilityDesc = (data.scalabilityDescription || "").trim();
  const marketChangingDesc = (data.marketChangingDescription || "").trim();
  const economicValueFactors = Array.isArray(data.economicValueFactors)
    ? data.economicValueFactors
    : [];
  const productServiceType = data.productServiceType || "";

  const checks = {
    ownershipOk: null,
    notPublicCompany: !isPublicCompany,
    descriptionPresent: description.length >= 10,
    problemStatementPresent: problemStatement.length >= 10,
    solutionStatementPresent: solutionStatement.length >= 10,
    innovationPresent: innovationDesc.length >= 20,
    techEnabledPresent: techEnabledDesc.length >= 20,
    scalabilityPresent: scalabilityDesc.length >= 20,
    marketChangingPresent: marketChangingDesc.length >= 20,
    economicValueFactorsPresent: economicValueFactors.length > 0,
    productServiceTypeValid: ["product", "service", "process"].includes(
      productServiceType,
    ),
    ownershipDeclared,
    affidavitPresent: !!affidavitUrl,
    ageOkIfLicensed: null,
  };

  // ── Article 7(2)(b): Founder ownership >= 25% ──
  if (ownership === null || ownership === undefined || ownership === "") {
    if (strict)
      errors.push("Founder ownership percent is required (minimum 25%).");
    else warnings.push("Founder ownership percent not provided yet.");
    checks.ownershipOk = false;
  } else if (Number(ownership) < 25) {
    errors.push("Founder ownership must be at least 25%.");
    checks.ownershipOk = false;
  } else {
    checks.ownershipOk = true;
  }

  // ── Article 7(2)(c): Not a public company ──
  if (isPublicCompany) {
    errors.push("Public companies are not eligible for startup designation.");
  }

  // ── Article 7(2)(a): Product ownership declaration + affidavit ──
  if (!ownershipDeclared) {
    if (strict) errors.push("Product ownership declaration is required.");
    else warnings.push("Product ownership declaration not confirmed yet.");
  }
  if (!affidavitUrl) {
    if (strict) errors.push("Ownership affidavit document is required.");
    else warnings.push("Ownership affidavit not uploaded yet.");
  }

  // ── Article 7: Innovation, Tech-Enabled, Scalable, Market-Changing ──
  if (!checks.innovationPresent) {
    if (strict)
      errors.push("Innovation description is required (min 20 characters).");
    else warnings.push("Innovation description is weak or missing.");
  }

  if (!checks.techEnabledPresent) {
    if (strict)
      errors.push(
        "Technology-enabled description is required (min 20 characters).",
      );
    else warnings.push("Technology-enabled description is missing.");
  }

  if (!checks.scalabilityPresent) {
    if (strict)
      errors.push("Scalability description is required (min 20 characters).");
    else warnings.push("Scalability description is missing.");
  }

  if (!checks.marketChangingPresent) {
    if (strict)
      errors.push(
        "Market-changing description is required (min 20 characters).",
      );
    else warnings.push("Market-changing description is missing.");
  }

  // ── Article 7(5): Economic value factors ──
  if (!checks.economicValueFactorsPresent) {
    if (strict)
      errors.push("At least one economic value factor must be selected.");
    else warnings.push("Economic value factors not selected.");
  }

  // ── Article 7: Product / Service / Process type ──
  if (!checks.productServiceTypeValid) {
    if (strict) errors.push("Product/service/process type is required.");
    else warnings.push("Product/service/process type not specified.");
  }

  // ── Basic profile completeness ──
  if (!checks.descriptionPresent) {
    if (strict) errors.push("Company description is required.");
    else warnings.push("Company description is missing.");
  }

  if (!checks.problemStatementPresent) {
    if (strict) errors.push("Problem statement is required.");
    else warnings.push("Problem statement is missing.");
  }

  if (!checks.solutionStatementPresent) {
    if (strict) errors.push("Solution statement is required.");
    else warnings.push("Solution statement is missing.");
  }

  // ── Article 7(3): If licensed, age <= 5 years ──
  if (hasLicense) {
    const age = yearsBetween(dateEstablished);
    if (age === null) {
      if (strict)
        errors.push("Date established is required for licensed organizations.");
      else
        warnings.push("Licensed organization should provide date established.");
      checks.ageOkIfLicensed = false;
    } else if (age > 5) {
      errors.push(
        "Licensed organizations older than 5 years are not eligible.",
      );
      checks.ageOkIfLicensed = false;
    } else {
      checks.ageOkIfLicensed = true;
    }
  } else {
    checks.ageOkIfLicensed = true;
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checks,
  };
}

function addWorkingDays(startDate, workingDays) {
  const date = new Date(startDate);
  let added = 0;
  while (added < workingDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay(); // 0 Sun, 6 Sat
    if (day !== 0 && day !== 6) added += 1;
  }
  return date;
}

module.exports = {
  evaluateStartupEligibility,
  addWorkingDays,
  yearsBetween,
};
