/**
 * Eligibility checks based on Startup Proclamation 1396/2025 concepts.
 * Used server-side so the API never trusts only frontend forms.
 */

function yearsBetween(fromDate, toDate = new Date()) {
  if (!fromDate) return null;
  const from = new Date(fromDate);
  if (Number.isNaN(from.getTime())) return null;
  const ms = toDate.getTime() - from.getTime();
  return ms / (1000 * 60 * 60 * 24 * 365.25);
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
  const innovation =
    (data.innovationDescription && String(data.innovationDescription).trim()) ||
    (data.solutionStatement && String(data.solutionStatement).trim()) ||
    '';
  const ownershipDeclared = data.productOwnershipDeclaration === true;

  const checks = {
    ownershipOk: null,
    notPublicCompany: !isPublicCompany,
    innovationPresent: innovation.length >= 10,
    ownershipDeclared,
    ageOkIfLicensed: null,
  };

  // Ownership >= 25%
  if (ownership === null || ownership === undefined || ownership === '') {
    if (strict) errors.push('Founder ownership percent is required (minimum 25%).');
    else warnings.push('Founder ownership percent not provided yet.');
    checks.ownershipOk = false;
  } else if (Number(ownership) < 25) {
    errors.push('Founder ownership must be at least 25%.');
    checks.ownershipOk = false;
  } else {
    checks.ownershipOk = true;
  }

  // Not a public company
  if (isPublicCompany) {
    errors.push('Public companies are not eligible for startup designation.');
  }

  // Innovation / tech value
  if (!checks.innovationPresent) {
    if (strict) errors.push('Innovation / solution description is required.');
    else warnings.push('Innovation description is weak or missing.');
  }

  // Product ownership declaration
  if (!ownershipDeclared) {
    if (strict) errors.push('Product ownership declaration is required.');
    else warnings.push('Product ownership declaration not confirmed yet.');
  }

  // If licensed organization, age should be <= 5 years
  if (hasLicense) {
    const age = yearsBetween(dateEstablished);
    if (age === null) {
      if (strict) errors.push('Date established is required for licensed organizations.');
      else warnings.push('Licensed organization should provide date established.');
      checks.ageOkIfLicensed = false;
    } else if (age > 5) {
      errors.push('Licensed organizations older than 5 years are not eligible.');
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