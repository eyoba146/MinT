const Startup = require("../models/Startup");
const CaseDecision = require("../models/CaseDecision");
const DesignationCertificate = require("../models/DesignationCertificate");
const sendEmail = require("../utils/sendEmail");
const cloudinary = require("../config/cloudinary");
const Document = require("../models/Document");
const PDFDocument = require("pdfkit");
const {
  evaluateStartupEligibility,
  addWorkingDays,
} = require("../services/eligibilityService");

const PUBLIC_STATUSES = ["designated"];

function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function makeDesignationId() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MINT-DES-${year}-${rand}`;
}

function makeCertificateNumber(designationId) {
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `${designationId}-${seq}`;
}

// `fundingStage` is a founder-facing display value, while the designation
// record uses stable normalized enum values.
function normalizeGrowthStage(fundingStage) {
  const stages = {
    Idea: "idea",
    "Pre-seed": "pre_seed",
    Seed: "seed",
    "Series A": "early_growth",
    Growth: "growth",
  };

  return stages[fundingStage] || "seed";
}

// Older records may contain a Cloudinary public ID (or version/public ID)
// instead of the secure URL returned by current uploads.
function normalizeLogoUrl(logo) {
  if (typeof logo !== "string" || !logo.trim()) return logo;
  if (/^(https?:|data:)/i.test(logo)) return logo;
  if (!process.env.CLOUDINARY_CLOUD_NAME) return logo;

  const legacyVersion = logo.match(/^(\d+)\/(.+)$/);
  const publicId = legacyVersion ? legacyVersion[2] : logo;
  const options = { secure: true, resource_type: "image" };
  if (legacyVersion) options.version = legacyVersion[1];

  return cloudinary.url(publicId, options);
}

// Upload buffer to Cloudinary
function streamUpload(buffer, folder) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let stream;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve(result);
    };
    const timeout = setTimeout(() => {
      const error = new Error(
        "Cloudinary file upload timed out after 20 seconds. Check the server Cloudinary settings and try again.",
      );
      if (stream) stream.destroy(error);
      finish(error);
    }, 20000);

    try {
      stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "auto" },
        finish,
      );
      stream.on("error", finish);
      stream.end(buffer);
    } catch (error) {
      finish(error);
    }
  });
}

// Normalize economicValueFactors from multipart (string vs array)
function normalizeFactors(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "")
    return defaultValue;
  if (typeof value === "boolean") return value;
  return value === "true" || value === "1";
}

function normalizeStartupPayload(body = {}) {
  const payload = { ...body };
  // Support clients deployed before the field was renamed.
  if (!payload.description && payload.oneLineDescription) {
    payload.description = payload.oneLineDescription;
  }
  if (!payload.oneLineDescription && payload.description) {
    payload.oneLineDescription = payload.description;
  }
  const booleanFields = [
    "isPublicCompany",
    "hasBusinessLicense",
    "productOwnershipDeclaration",
  ];
  booleanFields.forEach((field) => {
    if (field in payload) payload[field] = parseBoolean(payload[field]);
  });

  ["teamSize", "foundedYear", "founderOwnershipPercent"].forEach((field) => {
    if (payload[field] !== undefined && payload[field] !== "") {
      payload[field] = Number(payload[field]);
    }
  });

  payload.economicValueFactors = normalizeFactors(payload.economicValueFactors);
  return payload;
}

// ====================== CREATE STARTUP (Founder) ======================
exports.createStartup = async (req, res) => {
  try {
    const existing = await Startup.findOne({ founder: req.user._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already have a startup profile",
      });
    }

    const payload = normalizeStartupPayload(req.body);
    const strict = parseBoolean(payload.strictEligibility);
    delete payload.strictEligibility;
    const eligibility = evaluateStartupEligibility(payload, { strict });

    if (!eligibility.ok) {
      return res.status(400).json({
        success: false,
        message: "Eligibility checks failed",
        errors: eligibility.errors,
        warnings: eligibility.warnings,
        checks: eligibility.checks,
      });
    }

    // Handle file uploads to Cloudinary (parallel)
    let logoUrl = null;
    let affidavitUrl = null;
    if (req.files) {
      const uploads = [];
      if (req.files.logo && req.files.logo[0]) {
        uploads.push(
          streamUpload(req.files.logo[0].buffer, "mints/startups/logos").then(
            (r) => {
              logoUrl = r.secure_url;
            },
          ),
        );
      }
      if (req.files.affidavit && req.files.affidavit[0]) {
        uploads.push(
          streamUpload(
            req.files.affidavit[0].buffer,
            "mints/startups/affidavits",
          ).then((r) => {
            affidavitUrl = r.secure_url;
          }),
        );
      }
      await Promise.all(uploads);
    }

    const startup = await Startup.create({
      ...payload,
      logo: logoUrl,
      affidavitUrl: affidavitUrl,
      founder: req.user._id,
      status: "draft",
      submittedAt: null,
      reviewDueAt: null,
    });

    await CaseDecision.create({
      entityType: "startup",
      entityId: startup._id,
      action: "create",
      reason: "Startup profile created",
      notes: eligibility.warnings.join("; "),
      actor: req.user._id,
      meta: { eligibility, strict },
    });

    res.status(201).json({
      success: true,
      message:
        "Startup profile created. Save as draft or submit for designation review.",
      data: startup,
      eligibility,
    });
  } catch (error) {
    console.error("Create startup error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// ====================== GET MY STARTUP (Founder) ======================
// (unchanged from previous version)

// ====================== FOUNDER: SUBMIT FOR DESIGNATION ======================
exports.submitStartup = async (req, res) => {
  try {
    const startup = await Startup.findOne({ founder: req.user._id });

    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "No startup found" });
    }

    if (!["draft", "rejected"].includes(startup.status)) {
      return res.status(400).json({
        success: false,
        message: "Startup cannot be submitted in its current state",
      });
    }

    const eligibility = evaluateStartupEligibility(startup, { strict: true });

    if (!eligibility.ok) {
      return res.status(400).json({
        success: false,
        message: "Eligibility checks failed. Correct before submitting.",
        errors: eligibility.errors,
        warnings: eligibility.warnings,
        checks: eligibility.checks,
      });
    }

    const now = new Date();
    const reviewDueAt = addWorkingDays(now, 30);

    startup.status = "submitted";
    startup.submittedAt = now;
    startup.reviewDueAt = reviewDueAt;
    startup.rejectionReason = "";
    startup.reviewOutcome = null;
    startup.reviewerRating = null;
    startup.evaluationScores = {};
    await startup.save();

    await CaseDecision.create({
      entityType: "startup",
      entityId: startup._id,
      action: "submit",
      reason: "Startup application submitted for designation",
      notes: eligibility.warnings.join("; "),
      actor: req.user._id,
      meta: { eligibility, reviewDueAt },
    });

    res.status(200).json({
      success: true,
      message: "Startup submitted for MinT designation review.",
      data: startup,
    });
  } catch (error) {
    console.error("Submit startup error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// ====================== GET MY STARTUP (Founder) ======================
exports.getMyStartup = async (req, res) => {
  try {
    const startup = await Startup.findOne({ founder: req.user._id });

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: "No startup found. Please create one.",
      });
    }

    const eligibility = evaluateStartupEligibility(startup, { strict: false });

    res.status(200).json({
      success: true,
      data: startup,
      eligibility,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== UPDATE MY STARTUP (Founder) ======================
exports.updateMyStartup = async (req, res) => {
  try {
    const startup = await Startup.findOne({ founder: req.user._id });

    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Startup not found" });
    }

    // Founders can only edit if not currently under active review
    if (
      ["under_review", "designated", "suspended", "revoked"].includes(
        startup.status,
      )
    ) {
      return res.status(403).json({
        success: false,
        message: `Cannot edit startup while status is ${startup.status}`,
      });
    }

    const payload = normalizeStartupPayload(req.body);
    delete payload.strictEligibility;
    delete payload.status; // prevent status override
    delete payload.reviewOutcome;
    delete payload.reviewerRating;
    delete payload.evaluationScores;

    Object.assign(startup, payload);

    // Keep uploaded files when editing an existing draft. The previous
    // duplicate handler silently replaced the upload-aware implementation.
    if (req.files) {
      const uploads = [];
      if (req.files.logo && req.files.logo[0]) {
        uploads.push(
          streamUpload(req.files.logo[0].buffer, "mints/startups/logos").then(
            (result) => {
              startup.logo = result.secure_url;
            },
          ),
        );
      }
      if (req.files.affidavit && req.files.affidavit[0]) {
        uploads.push(
          streamUpload(
            req.files.affidavit[0].buffer,
            "mints/startups/affidavits",
          ).then((result) => {
            startup.affidavitUrl = result.secure_url;
          }),
        );
      }
      await Promise.all(uploads);
    }

    const strict = parseBoolean(req.body?.strictEligibility);
    const eligibility = evaluateStartupEligibility(startup, { strict });

    if (!eligibility.ok) {
      return res.status(400).json({
        success: false,
        message: "Eligibility checks failed",
        errors: eligibility.errors,
        warnings: eligibility.warnings,
        checks: eligibility.checks,
      });
    }

    await startup.save();

    res.status(200).json({
      success: true,
      message: "Startup updated successfully",
      data: startup,
      eligibility,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// ====================== GET ALL DESIGNATED STARTUPS (Public) ======================
exports.getVerifiedStartups = async (req, res) => {
  try {
    const startups = await Startup.find({ status: { $in: PUBLIC_STATUSES } })
      .sort({ designatedAt: -1 })
      .select(
        "-rejectionReason -suspensionReason -revocationReason -reviewerNotes -clarificationRequests",
      );

    startups.forEach((startup) => {
      startup.logo = normalizeLogoUrl(startup.logo);
    });

    res.status(200).json({
      success: true,
      count: startups.length,
      data: startups,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== GET SINGLE STARTUP ======================
exports.getStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Startup not found" });
    }

    const isPublic = PUBLIC_STATUSES.includes(startup.status);
    const isOwner =
      req.user && startup.founder.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === "admin";
    const isReviewer = req.user && req.user.role === "reviewer";

    if (!isPublic && !isOwner && !isAdmin && !isReviewer) {
      return res.status(403).json({
        success: false,
        message: "This startup is not public yet",
      });
    }

    startup.logo = normalizeLogoUrl(startup.logo);

    res.status(200).json({ success: true, data: startup });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== ADMIN / REVIEWER: CASE DETAIL ======================
exports.getStartupCase = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id).populate(
      "founder",
      "fullName email role",
    );

    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Startup not found" });
    }

    const [certificate, auditTrail] = await Promise.all([
      DesignationCertificate.findOne({ startup: startup._id }).sort({
        issuedAt: -1,
      }),
      CaseDecision.find({ entityType: "startup", entityId: startup._id })
        .populate("actor", "fullName email role")
        .sort({ createdAt: -1 }),
    ]);

    const eligibility = evaluateStartupEligibility(startup, { strict: false });
    const now = new Date();
    const isOverdue =
      startup.reviewDueAt &&
      ["submitted", "under_review", "clarification_needed"].includes(
        startup.status,
      ) &&
      new Date(startup.reviewDueAt) < now;

    res.status(200).json({
      success: true,
      data: {
        startup,
        certificate,
        auditTrail,
        eligibility,
        meta: {
          isOverdue: Boolean(isOverdue),
          reviewDueAt: startup.reviewDueAt,
        },
      },
    });
  } catch (error) {
    console.error("Get startup case error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// ====================== ADMIN / REVIEWER: REVIEW QUEUE ======================
exports.getPendingStartups = async (req, res) => {
  try {
    const startups = await Startup.find({
      status: { $in: ["submitted", "under_review", "clarification_needed"] },
    })
      .populate("founder", "fullName email")
      .sort({ submittedAt: 1 }); // oldest first

    res.status(200).json({
      success: true,
      count: startups.length,
      data: startups,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== REVIEWER: START REVIEW ======================
exports.startReview = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Startup not found" });
    }

    if (!["submitted", "clarification_needed"].includes(startup.status)) {
      return res.status(400).json({
        success: false,
        message:
          "Only submitted or clarification-needed cases can enter review",
      });
    }

    const notes = (req.body?.notes || "").trim();
    if (!notes || notes.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Review notes are required (at least 10 characters)",
      });
    }

    startup.status = "under_review";
    startup.reviewStartedAt = new Date();
    startup.reviewedBy = req.user._id;
    startup.reviewerNotes = notes;
    await startup.save();

    await CaseDecision.create({
      entityType: "startup",
      entityId: startup._id,
      action: "start_review",
      reason: "Reviewer began formal evaluation",
      notes,
      actor: req.user._id,
      meta: { reviewerRole: req.user.role },
    });

    res.status(200).json({
      success: true,
      message: "Marked under review. Evaluation in progress.",
      data: startup,
    });
  } catch (error) {
    console.error("Start review error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// ====================== REVIEWER: REQUEST CLARIFICATION ======================
exports.requestClarification = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id).populate(
      "founder",
      "fullName email",
    );
    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Startup not found" });
    }

    if (startup.status !== "under_review") {
      return res.status(400).json({
        success: false,
        message: "Clarification can only be requested while under review",
      });
    }

    const { question } = req.body;
    if (!question || question.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Clarification question is required (min 10 chars)",
      });
    }

    startup.status = "clarification_needed";
    startup.clarificationRequests.push({
      question: question.trim(),
      requestedAt: new Date(),
      resolved: false,
    });
    await startup.save();

    await CaseDecision.create({
      entityType: "startup",
      entityId: startup._id,
      action: "request_clarification",
      reason: "Reviewer requested additional information",
      notes: question.trim(),
      actor: req.user._id,
    });

    // Notify founder
    if (startup.founder?.email) {
      await sendEmail({
        to: startup.founder.email,
        subject: `Clarification Needed – ${startup.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d97706;">Clarification Required</h2>
            <p>Hello ${startup.founder.fullName || "Founder"},</p>
            <p>
              Your application for <strong>${startup.companyName}</strong> requires
              additional information before we can proceed with designation review.
            </p>
            <p><strong>Question:</strong> ${question.trim()}</p>
            <p>Please log in to the portal and respond.</p>
          </div>
        `,
      });
    }

    res.status(200).json({
      success: true,
      message: "Clarification requested",
      data: startup,
    });
  } catch (error) {
    console.error("Request clarification error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// ====================== FOUNDER: RESPOND TO CLARIFICATION ======================
exports.respondToClarification = async (req, res) => {
  try {
    const startup = await Startup.findOne({ founder: req.user._id });
    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Startup not found" });
    }

    if (startup.status !== "clarification_needed") {
      return res.status(400).json({
        success: false,
        message: "No pending clarification request",
      });
    }

    const { clarificationId, response } = req.body;
    if (!response || response.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Response is required",
      });
    }

    const item = startup.clarificationRequests.id(clarificationId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Clarification item not found" });
    }
    if (item.resolved) {
      return res
        .status(400)
        .json({ success: false, message: "Already resolved" });
    }

    item.response = response.trim();
    item.respondedAt = new Date();
    item.resolved = true;

    // Return to review queue
    startup.status = "under_review";
    await startup.save();

    await CaseDecision.create({
      entityType: "startup",
      entityId: startup._id,
      action: "clarification_response",
      reason: "Founder responded to clarification",
      notes: response.trim(),
      actor: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Response submitted. Case returned to review.",
      data: startup,
    });
  } catch (error) {
    console.error("Clarification response error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// ====================== REVIEWER / ADMIN: SUBMIT REVIEW DECISION ======================
// Replaces the old binary approve/reject. Now supports:
//   outcome: 'approved' | 'needs_clarification' | 'rejected'
//   rating: 1-5
//   scores: { innovation, scalability, technology, marketImpact, economicValue, overall }
exports.submitReview = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id).populate(
      "founder",
      "fullName email",
    );

    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Startup not found" });
    }

    if (startup.status !== "under_review") {
      return res.status(400).json({
        success: false,
        message: "Review can only be submitted for cases under review",
      });
    }

    const { outcome, rating, scores, notes } = req.body;

    if (!["approved", "needs_clarification", "rejected"].includes(outcome)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid outcome. Must be approved, needs_clarification, or rejected",
      });
    }

    // Validate scores
    const requiredScores = [
      "innovation",
      "scalability",
      "technology",
      "marketImpact",
      "economicValue",
      "overall",
    ];
    if (
      !scores ||
      requiredScores.some(
        (k) => typeof scores[k] !== "number" || scores[k] < 1 || scores[k] > 5,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All evaluation scores (1-5) are required: innovation, scalability, technology, marketImpact, economicValue, overall",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Reviewer rating (1-5) is required",
      });
    }

    const now = new Date();
    startup.reviewOutcome = outcome;
    startup.reviewerRating = rating;
    startup.evaluationScores = scores;
    startup.reviewedAt = now;
    startup.reviewedBy = req.user._id;
    startup.reviewerNotes = (notes || "").trim();

    // FIXED
    if (outcome === "needs_clarification") {
      startup.status = "clarification_needed";
      startup.clarificationRequests.push({
        question: notes?.trim() || "Additional information required",
        requestedAt: new Date(),
        resolved: false,
      });
      await startup.save();

      await CaseDecision.create({
        entityType: "startup",
        entityId: startup._id,
        action: "review_needs_clarification",
        reason: "Reviewer needs more information before final decision",
        notes: notes || "",
        actor: req.user._id,
        meta: { scores, rating },
      });

      if (startup.founder?.email) {
        await sendEmail({
          to: startup.founder.email,
          subject: `Clarification Needed – ${startup.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #d97706;">Clarification Required</h2>
              <p>Hello ${startup.founder.fullName || "Founder"},</p>
              <p>
                Your application for <strong>${startup.companyName}</strong> requires
                additional information before we can proceed with designation review.
              </p>
              <p><strong>Reviewer notes:</strong> ${notes || "Please log in to see details."}</p>
              <p>Please log in to the portal and check your application status.</p>
            </div>
          `,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Review submitted: needs clarification",
        data: startup,
      });
    }

    if (outcome === "rejected") {
      startup.status = "rejected";
      startup.rejectionReason = notes || "Did not meet designation criteria";
      await startup.save();

      await CaseDecision.create({
        entityType: "startup",
        entityId: startup._id,
        action: "reject",
        reason: startup.rejectionReason,
        notes: notes || "",
        actor: req.user._id,
        meta: { scores, rating },
      });

      if (startup.founder?.email) {
        await sendEmail({
          to: startup.founder.email,
          subject: `Designation Update – ${startup.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #64748b;">Startup Designation Update</h2>
              <p>Hello ${startup.founder.fullName || "Founder"},</p>
              <p>
                After review, <strong>${startup.companyName}</strong> was <strong>not approved</strong>
                for MinT designation at this time.
              </p>
              <p><strong>Reason:</strong> ${startup.rejectionReason}</p>
              <p><strong>Overall Score:</strong> ${scores.overall}/5</p>
              <p style="color: #666; font-size: 13px; margin-top: 30px;">
                Digital Innovation Hub · Ministry of Innovation and Technology
              </p>
            </div>
          `,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Startup rejected",
        data: startup,
      });
    }

    // outcome === 'approved' → DESIGNATE per Art. 12, 14
    const designationId = makeDesignationId();
    const certificateNumber = makeCertificateNumber(designationId);
    const expiresAt = addYears(now, 2); // Art. 13(1): valid 2 years
    const maxUntil = addYears(now, 8); // Art. 13(4): max 8 years total

    startup.status = "designated";
    startup.designatedAt = now;
    startup.designationExpiresAt = expiresAt;
    startup.designationMaxUntil = maxUntil;
    startup.designationId = designationId;
    startup.certificateNumber = certificateNumber;
    startup.growthStageAtDesignation = normalizeGrowthStage(
      startup.fundingStage,
    );
    startup.rejectionReason = "";
    startup.suspensionReason = "";
    startup.revocationReason = "";
    await startup.save();

    await DesignationCertificate.findOneAndUpdate(
      { startup: startup._id },
      {
        startup: startup._id,
        designationId,
        certificateNumber,
        startupName: startup.companyName,
        founderNames: startup.founder?.fullName || "",
        growthStage: startup.growthStageAtDesignation,
        sector: startup.sector || "",
        issuedAt: now,
        expiresAt,
        issuedBy: req.user._id,
        status: "active",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await CaseDecision.create({
      entityType: "startup",
      entityId: startup._id,
      action: "designate",
      reason: "Startup designated by MinT reviewer/admin",
      notes: notes || "",
      actor: req.user._id,
      meta: {
        designationId,
        certificateNumber,
        designationExpiresAt: expiresAt,
        scores,
        rating,
      },
    });

    if (startup.founder?.email) {
      await sendEmail({
        to: startup.founder.email,
        subject: `MinT Designation Approved – ${startup.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0d9488;">Your Startup is Designated by MinT</h2>
            <p>Hello ${startup.founder.fullName || "Founder"},</p>
            <p>
              Congratulations! <strong>${startup.companyName}</strong> has been reviewed and
              <strong>designated</strong> by the Ministry of Innovation and Technology.
            </p>
            <p><strong>Designation ID:</strong> ${designationId}</p>
            <p><strong>Certificate No:</strong> ${certificateNumber}</p>
            <p><strong>Valid until:</strong> ${expiresAt.toDateString()}</p>
            <p><strong>Reviewer Rating:</strong> ${rating}/5</p>
            <p style="color: #666; font-size: 13px; margin-top: 30px;">
              Digital Innovation Hub · Ministry of Innovation and Technology
            </p>
          </div>
        `,
      });
    }

    res.status(200).json({
      success: true,
      message: "Startup designated",
      data: startup,
    });
  } catch (error) {
    console.error("Submit review error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// ====================== ADMIN: SUSPEND ======================
exports.suspendStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id).populate(
      "founder",
      "fullName email",
    );
    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Startup not found" });
    }

    const reason = (req.body?.reason || "").trim() || "Suspended by MinT admin";
    const notes = req.body?.notes || "";
    const founderEmail = startup.founder?.email;
    const founderName = startup.founder?.fullName || "Founder";
    const companyName = startup.companyName;

    startup.status = "suspended";
    startup.suspensionReason = reason;
    startup.suspendedAt = new Date();
    startup.reviewedBy = req.user._id;
    startup.reviewerNotes = notes;
    await startup.save();

    await DesignationCertificate.updateMany(
      { startup: startup._id, status: "active" },
      { status: "suspended" },
    );

    await CaseDecision.create({
      entityType: "startup",
      entityId: startup._id,
      action: "suspend",
      reason,
      notes,
      actor: req.user._id,
    });

    if (founderEmail) {
      await sendEmail({
        to: founderEmail,
        subject: `Designation Suspended – ${companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #b45309;">Designation Suspended</h2>
            <p>Hello ${founderName},</p>
            <p>
              The MinT designation for <strong>${companyName}</strong> has been
              <strong>suspended</strong>.
            </p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>Please rectify within 30 working days.</p>
            <p style="color: #666; font-size: 13px; margin-top: 30px;">
              Digital Innovation Hub · Ministry of Innovation and Technology
            </p>
          </div>
        `,
      });
    }

    res.status(200).json({
      success: true,
      message: "Startup suspended",
      data: startup,
    });
  } catch (error) {
    console.error("Suspend startup error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// ====================== ADMIN: REVOKE ======================
exports.revokeStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id).populate(
      "founder",
      "fullName email",
    );
    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Startup not found" });
    }

    const reason =
      (req.body?.reason || "").trim() || "Designation revoked by MinT admin";
    const notes = req.body?.notes || "";
    const founderEmail = startup.founder?.email;
    const founderName = startup.founder?.fullName || "Founder";
    const companyName = startup.companyName;

    startup.status = "revoked";
    startup.revocationReason = reason;
    startup.revokedAt = new Date();
    startup.reviewedBy = req.user._id;
    startup.reviewerNotes = notes;
    await startup.save();

    await DesignationCertificate.updateMany(
      { startup: startup._id },
      { status: "revoked" },
    );

    await CaseDecision.create({
      entityType: "startup",
      entityId: startup._id,
      action: "revoke",
      reason,
      notes,
      actor: req.user._id,
    });

    if (founderEmail) {
      await sendEmail({
        to: founderEmail,
        subject: `Designation Revoked – ${companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #be123c;">Designation Revoked</h2>
            <p>Hello ${founderName},</p>
            <p>
              The MinT designation for <strong>${companyName}</strong> has been
              <strong>revoked</strong>.
            </p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p style="color: #666; font-size: 13px; margin-top: 30px;">
              Digital Innovation Hub · Ministry of Innovation and Technology
            </p>
          </div>
        `,
      });
    }

    res.status(200).json({
      success: true,
      message: "Startup designation revoked",
      data: startup,
    });
  } catch (error) {
    console.error("Revoke startup error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// ====================== FOUNDER: REQUEST RENEWAL ======================
exports.requestRenewal = async (req, res) => {
  try {
    const startup = await Startup.findOne({ founder: req.user._id });
    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Startup not found" });
    }

    if (!["designated", "expired"].includes(startup.status)) {
      return res.status(400).json({
        success: false,
        message: "Only designated or expired startups can request renewal",
      });
    }

    if (!startup.designationExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "No designation expiry date found",
      });
    }

    const now = new Date();
    const expiresAt = new Date(startup.designationExpiresAt);
    const daysLeft = (expiresAt - now) / (1000 * 60 * 60 * 24);

    // Art. 13(2): must apply 30 working days before expiry
    if (daysLeft > 45 && startup.status !== "expired") {
      return res.status(400).json({
        success: false,
        message: "Renewal can be requested within 45 days of expiry",
      });
    }

    if (
      startup.designationMaxUntil &&
      now > new Date(startup.designationMaxUntil)
    ) {
      return res.status(400).json({
        success: false,
        message: "Maximum designation period (8 years) has been reached",
      });
    }

    startup.status = "submitted"; // resubmit for re-evaluation
    startup.submittedAt = now;
    startup.reviewDueAt = addWorkingDays(now, 30);
    await startup.save();

    await CaseDecision.create({
      entityType: "startup",
      entityId: startup._id,
      action: "renew",
      reason: "Founder requested designation renewal",
      notes: req.body?.notes || "",
      actor: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Renewal request submitted. Case re-entered review queue.",
      data: startup,
    });
  } catch (error) {
    console.error("Request renewal error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// ====================== ADMIN: DELETE ======================
exports.deleteStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Startup not found" });
    }

    const reason = req.body?.reason || "Deleted by admin";
    const notes = req.body?.notes || "";

    await CaseDecision.create({
      entityType: "startup",
      entityId: startup._id,
      action: "delete",
      reason,
      notes,
      actor: req.user._id,
    });

    await DesignationCertificate.deleteMany({ startup: startup._id });
    await startup.deleteOne();

    res.status(200).json({
      success: true,
      message: "Startup deleted successfully",
    });
  } catch (error) {
    console.error("Delete startup error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// ====================== ADMIN / STAFF: STATS ======================
exports.getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const User = require("../models/User");
    const Opportunity = require("../models/Opportunity");
    const EcosystemBuilder = require("../models/EcosystemBuilder");

    const [
      total,
      designated,
      submitted,
      underReview,
      clarificationNeeded,
      rejected,
      suspended,
      revoked,
      overdue,
      bySector,
      byStatus,
      byCountry,
      roleCounts,
      recentMonths,
      oppCounts,
      builderTotal,
      builderDesignated,
      builderPending,
      builderByType,
      builderByStatus,
    ] = await Promise.all([
      Startup.countDocuments(),
      Startup.countDocuments({ status: "designated" }),
      Startup.countDocuments({ status: "submitted" }),
      Startup.countDocuments({ status: "under_review" }),
      Startup.countDocuments({ status: "clarification_needed" }),
      Startup.countDocuments({ status: "rejected" }),
      Startup.countDocuments({ status: "suspended" }),
      Startup.countDocuments({ status: "revoked" }),
      Startup.countDocuments({
        status: { $in: ["submitted", "under_review", "clarification_needed"] },
        reviewDueAt: { $lt: now },
      }),
      Startup.aggregate([
        { $group: { _id: "$sector", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Startup.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Startup.aggregate([
        { $group: { _id: "$country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Startup.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
            },
          },
        },
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]),
      Opportunity.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      EcosystemBuilder.countDocuments(),
      EcosystemBuilder.countDocuments({ status: "designated" }),
      EcosystemBuilder.countDocuments({
        status: { $in: ["pending", "submitted", "under_review"] },
      }),
      EcosystemBuilder.aggregate([
        { $group: { _id: "$builderType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      EcosystemBuilder.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const roleMap = {
      founder: 0,
      investor: 0,
      citizen: 0,
      admin: 0,
      reviewer: 0,
      moderator: 0,
      ecosystem_builder: 0,
    };
    roleCounts.forEach((r) => {
      if (r._id && roleMap[r._id] !== undefined) roleMap[r._id] = r.count;
    });

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const applicationsOverTime = recentMonths.map((row) => ({
      label: `${monthNames[(row._id.m || 1) - 1]} ${row._id.y}`,
      count: row.count,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalStartups: total,
        designated,
        submitted,
        underReview,
        clarificationNeeded,
        rejected,
        suspended,
        revoked,
        overdue,
        totalInvestors: roleMap.investor,
        totalFounders: roleMap.founder,
        totalCitizens: roleMap.citizen,
        totalBuilders: builderTotal,
        designatedBuilders: builderDesignated,
        pendingBuilders: builderPending,
        totalUsers:
          roleMap.founder +
          roleMap.investor +
          roleMap.citizen +
          roleMap.admin +
          roleMap.reviewer +
          roleMap.moderator +
          roleMap.ecosystem_builder,
        charts: {
          statusChart: byStatus.map((s) => ({
            name: (s._id || "unknown").replace(/_/g, " "),
            value: s.count,
          })),
          sectorChart: bySector.map((s) => ({
            name: s._id || "Other",
            value: s.count,
          })),
          countryChart: byCountry.map((s) => ({
            name: s._id || "Unknown",
            value: s.count,
          })),
          usersByRole: Object.entries(roleMap).map(([name, value]) => ({
            name: name.replace(/_/g, " "),
            value,
          })),
          applicationsOverTime,
          opportunityByStatus: oppCounts.map((o) => ({
            name: o._id || "unknown",
            value: o.count,
          })),
          builderByType: builderByType.map((b) => ({
            name: (b._id || "other").replace(/_/g, " "),
            value: b.count,
          })),
          builderByStatus: builderByStatus.map((b) => ({
            name: (b._id || "unknown").replace(/_/g, " "),
            value: b.count,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== ADMIN: CONNECTION REPORT ======================
exports.getConnectionReport = async (req, res) => {
  try {
    const now = new Date();

    // All startups with investorConnections
    const startups = await Startup.find(
      { "investorConnections.0": { $exists: true } },
      {
        companyName: 1,
        sector: 1,
        status: 1,
        founder: 1,
        investorConnections: 1,
      },
    ).lean();

    // Flatten all connections
    const allConnections = [];
    startups.forEach((s) => {
      (s.investorConnections || []).forEach((c) => {
        allConnections.push({
          ...c,
          startup: {
            _id: s._id,
            companyName: s.companyName,
            sector: s.sector,
            startupStatus: s.status,
            founder: s.founder,
          },
        });
      });
    });

    const total = allConnections.length;
    const active = allConnections.filter(
      (c) => c.status !== "closed" && c.status !== "declined",
    ).length;
    const closed = allConnections.filter((c) => c.status === "closed").length;
    const declined = allConnections.filter(
      (c) => c.status === "declined",
    ).length;
    const successful = closed; // closed means deal successfully executed (after gates)
    const failed = declined;

    // Breakdown by current status
    const byStatus = Object.entries(
      allConnections.reduce((acc, c) => {
        const key = c.status || "unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ name, value }));

    // Breakdown by sector (based on startup sector)
    const bySector = Object.entries(
      allConnections.reduce((acc, c) => {
        const sector = c.startup?.sector || "Other";
        acc[sector] = (acc[sector] || 0) + 1;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ name, value }));

    // Breakdown by investment type
    const byInvestmentType = Object.entries(
      allConnections.reduce((acc, c) => {
        const type = c.investmentType || "none_yet";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ name, value }));

    // Decline reasons summary
    const declinedReasons =
      declined > 0
        ? allConnections
            .filter((c) => c.status === "declined")
            .reduce((acc, c) => {
              const reason = c.declineReason || "Declined (no reason provided)";
              acc[reason] = (acc[reason] || 0) + 1;
              return acc;
            }, {})
        : {};

    const avgDealSize =
      allConnections
        .filter((c) => c.amount && c.amount > 0)
        .reduce((sum, c) => sum + c.amount, 0) || 0;

    res.status(200).json({
      success: true,
      data: {
        totalConnections: total,
        activeConnections: active,
        successfulConnections: successful,
        declinedConnections: declined,
        closedConnections: closed,
        failedConnections: failed,
        avgDealSize: avgDealSize,
        byStatus,
        bySector,
        byInvestmentType,
        declinedReasons,
        sampleConnections: allConnections.slice(0, 20), // optional: for deep inspection
      },
    });
  } catch (error) {
    console.error("Connection report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// ====================== ADMIN: EXPORT CONNECTION REPORT ======================
exports.exportConnectionReport = async (req, res) => {
  try {
    const { format = "csv" } = req.query; // csv, xlsx, pdf

    // Fetch and aggregate data (same as getConnectionReport)
    const startups = await Startup.find(
      { "investorConnections.0": { $exists: true } },
      {
        companyName: 1,
        sector: 1,
        status: 1,
        founder: 1,
        investorConnections: 1,
      },
    ).lean();

    const allConnections = [];
    startups.forEach((s) => {
      (s.investorConnections || []).forEach((c) => {
        allConnections.push({
          startupName: s.companyName,
          sector: s.sector,
          startupStatus: s.status,
          investorId: c.investor,
          status: c.status,
          investmentType: c.investmentType,
          amount: c.amount,
          currency: c.currency,
          notes: c.notes,
          dataRoomApproved: c.dataRoomApproved,
          termSheetApproved: c.termSheetApproved,
          dealExecutionApproved: c.dealExecutionApproved,
          declinedAt: c.declinedAt,
          declineReason: c.declineReason,
          connectedAt: c.connectedAt,
          lastActivityAt: c.lastActivityAt,
        });
      });
    });

    if (format === "csv") {
      const { Parser } = require("json2csv");
      const fields = [
        "startupName",
        "sector",
        "startupStatus",
        "status",
        "investmentType",
        "amount",
        "currency",
        "dataRoomApproved",
        "termSheetApproved",
        "dealExecutionApproved",
        "declinedAt",
        "declineReason",
        "connectedAt",
        "lastActivityAt",
      ];
      const parser = new Parser({ fields });
      const csv = parser.parse(allConnections);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=connection-report-${Date.now()}.csv`,
      );
      return res.send(csv);
    }

    if (format === "xlsx") {
      const ExcelJS = require("exceljs");
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Connections");

      worksheet.columns = [
        { header: "Startup", key: "startupName", width: 25 },
        { header: "Sector", key: "sector", width: 15 },
        { header: "Status", key: "status", width: 20 },
        { header: "Investment Type", key: "investmentType", width: 20 },
        { header: "Amount", key: "amount", width: 15 },
        { header: "Currency", key: "currency", width: 10 },
        { header: "Data Room", key: "dataRoomApproved", width: 12 },
        { header: "Term Sheet", key: "termSheetApproved", width: 12 },
        { header: "Deal Execution", key: "dealExecutionApproved", width: 15 },
        { header: "Declined At", key: "declinedAt", width: 20 },
        { header: "Decline Reason", key: "declineReason", width: 35 },
        { header: "Connected At", key: "connectedAt", width: 20 },
        { header: "Last Activity", key: "lastActivityAt", width: 20 },
      ];

      allConnections.forEach((row) => worksheet.addRow(row));

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=connection-report-${Date.now()}.xlsx`,
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

    if (format === "pdf") {
      const PDFDocument = require("pdfkit");
      const doc = new PDFDocument({ margin: 30, size: "A4" });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=connection-report-${Date.now()}.pdf`,
      );

      doc.pipe(res);

      doc.fontSize(18).text("MinT Digital Innovation Hub", { align: "center" });
      doc.fontSize(14).text("Investor Connection Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`);
      doc.moveDown();

      doc.fontSize(12).text("Summary");
      doc.fontSize(10).text(`Total Connections: ${allConnections.length}`);
      const active = allConnections.filter(
        (c) => c.status !== "closed" && c.status !== "declined",
      ).length;
      const closed = allConnections.filter((c) => c.status === "closed").length;
      const declined = allConnections.filter(
        (c) => c.status === "declined",
      ).length;
      doc.text(`Active: ${active}`);
      doc.text(`Closed: ${closed}`);
      doc.text(`Declined: ${declined}`);
      doc.moveDown();

      doc.fontSize(12).text("Connection Details");
      doc.moveDown(0.5);

      allConnections.forEach((c, i) => {
        if (i > 0) doc.moveDown(0.5);
        doc.fontSize(10).text(`${i + 1}. ${c.startupName} (${c.sector})`);
        doc.fontSize(9).text(`   Status: ${c.status}`);
        doc.text(`   Investment Type: ${c.investmentType}`);
        if (c.amount) doc.text(`   Amount: ${c.amount} ${c.currency}`);
        if (c.declineReason) doc.text(`   Decline Reason: ${c.declineReason}`);
        doc.text(
          `   Connected: ${new Date(c.connectedAt).toLocaleDateString()}`,
        );
        doc.text(
          `   Last Activity: ${new Date(c.lastActivityAt).toLocaleDateString()}`,
        );
        doc.moveDown(0.5);
      });

      doc.end();
      return;
    }

    return res.status(400).json({
      success: false,
      message: "Invalid format. Use csv, xlsx, or pdf",
    });
  } catch (error) {
    console.error("Export connection report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// ====================== ADMIN / REVIEWER / MODERATOR: LIST ======================
exports.getAdminStartups = async (req, res) => {
  try {
    const { status, search, sector } = req.query;
    const filter = {};

    if (status && status !== "all") {
      if (status === "pending" || status === "queue") {
        filter.status = {
          $in: ["submitted", "under_review", "clarification_needed"],
        };
      } else if (status === "designated") {
        filter.status = "designated";
      } else if (status === "rejected") {
        filter.status = "rejected";
      } else if (status === "suspended") {
        filter.status = "suspended";
      } else if (status === "under_review") {
        filter.status = "under_review";
      } else if (status === "clarification_needed") {
        filter.status = "clarification_needed";
      } else {
        filter.status = status;
      }
    }

    if (sector) filter.sector = sector;
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const startups = await Startup.find(filter)
      .populate("founder", "fullName email")
      .sort({ createdAt: -1 })
      .select("-reviewerNotes");

    res.status(200).json({
      success: true,
      count: startups.length,
      data: startups,
    });
  } catch (error) {
    console.error("Admin startups error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== PUBLIC STATS ======================
exports.getPublicStats = async (req, res) => {
  try {
    const User = require("../models/User");

    const [designated, totalInvestors, totalStartups] = await Promise.all([
      Startup.countDocuments({ status: "designated" }),
      User.countDocuments({ role: "investor" }),
      Startup.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        designatedStartups: designated,
        totalInvestors,
        totalStartups,
        sectorsCovered: 7,
      },
    });
  } catch (error) {
    console.error("Public stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// POST /startups/:id/express-interest
// ====================== INVESTOR: EXPRESS INTEREST ======================
exports.expressInterest = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id).populate(
      "founder",
      "fullName email",
    );

    if (!startup || !PUBLIC_STATUSES.includes(startup.status)) {
      return res.status(400).json({
        success: false,
        message: "Startup not found or not designated",
      });
    }

    // Prevent duplicate interest from same investor
    const existing = startup.investorConnections.find(
      (c) => c.investor.toString() === req.user._id.toString(),
    );
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already expressed interest in this startup",
        data: existing,
      });
    }

    const { message, investmentType, amount, currency } = req.body;

    startup.investorConnections.push({
      investor: req.user._id,
      status: "interest_expressed",
      investmentType: investmentType || "none_yet",
      amount: amount ? Number(amount) : null,
      currency: currency || "ETB",
      notes: message || "",
      lastActivityAt: new Date(),
    });

    await startup.save();

    // Audit trail
    await CaseDecision.create({
      entityType: "startup",
      entityId: startup._id,
      action: "express_interest",
      reason: "Investor expressed interest",
      notes: message || "",
      actor: req.user._id,
      meta: { investmentType, amount, currency },
    });

    // Notify founder
    if (startup.founder?.email) {
      await sendEmail({
        to: startup.founder.email,
        subject: `New Investor Interest – ${startup.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0d9488;">New Investor Interest</h2>
            <p>Hello ${startup.founder.fullName || "Founder"},</p>
            <p><strong>${req.user.fullName || "An investor"}</strong> has expressed interest in <strong>${startup.companyName}</strong>.</p>
            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
            <p>Log in to your dashboard to review and manage this connection.</p>
          </div>
        `,
      });
    }

    res.status(200).json({
      success: true,
      message: "Interest expressed successfully",
      data: startup.investorConnections[startup.investorConnections.length - 1],
    });
  } catch (error) {
    console.error("Express interest error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// ====================== INVESTOR: GET MY CONNECTIONS ======================
exports.getInvestorConnections = async (req, res) => {
  try {
    const startups = await Startup.find({
      "investorConnections.investor": req.user._id,
    })
      .populate("founder", "fullName email")
      .populate("investorConnections.messages.sender", "fullName email role")
      .select("companyName logo sector status investorConnections founder");

    const connections = [];
    startups.forEach((s) => {
      s.investorConnections
        .filter((c) => c.investor.toString() === req.user._id.toString())
        .forEach((c) => {
          connections.push({
            ...c.toObject(),
            startup: {
              _id: s._id,
              companyName: s.companyName,
              logo: normalizeLogoUrl(s.logo),
              sector: s.sector,
              status: s.status,
              founder: s.founder,
            },
          });
        });
    });

    connections.sort(
      (a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt),
    );

    res.status(200).json({
      success: true,
      count: connections.length,
      data: connections,
    });
  } catch (error) {
    console.error("Get investor connections error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== FOUNDER: GET INCOMING CONNECTIONS ======================
exports.getMyConnections = async (req, res) => {
  try {
    const startup = await Startup.findOne({ founder: req.user._id })
      .populate(
        "investorConnections.investor",
        "fullName email organization investmentRange focus",
      )
      .populate("investorConnections.messages.sender", "fullName email role")
      .select("companyName investorConnections");

    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "No startup found" });
    }

    const connections = (startup.investorConnections || []).sort(
      (a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt),
    );

    res.status(200).json({
      success: true,
      count: connections.length,
      data: connections,
    });
  } catch (error) {
    console.error("Get my connections error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== UPDATE CONNECTION STAGE ======================
// ====================== UPDATE CONNECTION STAGE ======================
exports.updateConnectionStage = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { stage, notes } = req.body;

    const VALID_STAGES = [
      "interest_expressed",
      "data_room_accessed",
      "meeting_scheduled",
      "due_diligence",
      "term_sheet",
      "investment_executed",
      "grant_disbursed",
      "guarantee_issued",
      "closed",
    ];

    if (!VALID_STAGES.includes(stage)) {
      return res.status(400).json({
        success: false,
        message: `Invalid stage. Must be one of: ${VALID_STAGES.join(", ")}`,
      });
    }

    const startup = await Startup.findOne({
      "investorConnections._id": connectionId,
    }).populate("founder", "fullName email");

    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    const connection = startup.investorConnections.id(connectionId);
    if (!connection) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    // Auth: must be the investor who created it OR the founder of the startup
    const isInvestor =
      connection.investor.toString() === req.user._id.toString();
    const isFounder =
      startup.founder._id.toString() === req.user._id.toString();

    if (!isInvestor && !isFounder) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // Prevent backward moves (except to closed)
    const currentIdx = VALID_STAGES.indexOf(connection.status);
    const newIdx = VALID_STAGES.indexOf(stage);
    if (newIdx < currentIdx && stage !== "closed") {
      return res.status(400).json({
        success: false,
        message: "Cannot move connection to a previous stage",
      });
    }

    // FOUNDER GATE: investor cannot advance to data_room_accessed without founder approval
    if (stage === "data_room_accessed" && !connection.dataRoomApproved) {
      return res.status(403).json({
        success: false,
        message: "Founder must approve data room access before you can proceed",
      });
    }
    // FOUNDER GATE: term sheet approval required before moving to execution
    if (
      ["investment_executed", "grant_disbursed", "guarantee_issued"].includes(
        stage,
      ) &&
      connection.status === "term_sheet" &&
      !connection.termSheetApproved
    ) {
      return res.status(403).json({
        success: false,
        message: "Founder must approve the term sheet before you can proceed",
      });
    }

    // FOUNDER GATE: deal execution approval required before closing
    if (
      stage === "closed" &&
      ["investment_executed", "grant_disbursed", "guarantee_issued"].includes(
        connection.status,
      ) &&
      !connection.dealExecutionApproved
    ) {
      return res.status(403).json({
        success: false,
        message: "Founder must confirm deal execution before closing",
      });
    }
    const previousStage = connection.status;
    connection.status = stage;
    connection.lastActivityAt = new Date();
    if (notes) {
      connection.notes = connection.notes
        ? `${connection.notes}\n\n[${new Date().toLocaleDateString()}] ${notes}`
        : notes;
    }

    await startup.save();

    // Audit
    await CaseDecision.create({
      entityType: "startup",
      entityId: startup._id,
      action: "connection_stage_update",
      reason: `Connection moved from ${previousStage} to ${stage}`,
      notes: notes || "",
      actor: req.user._id,
      meta: { connectionId, previousStage, newStage: stage },
    });

    // Notify other party
    const notifyEmail = isInvestor ? startup.founder?.email : null;
    if (notifyEmail) {
      await sendEmail({
        to: notifyEmail,
        subject: `Deal Update – ${startup.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0d9488;">Deal Stage Update</h2>
            <p>The deal with <strong>${startup.companyName}</strong> has moved to <strong>${stage.replace(/_/g, " ")}</strong>.</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
            <p>Updated by: ${isInvestor ? "Investor" : "Founder"}</p>
          </div>
        `,
      });
    }

    res.status(200).json({
      success: true,
      message: "Connection stage updated",
      data: connection,
    });
  } catch (error) {
    console.error("Update connection stage error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// ====================== FOUNDER: APPROVE / DECLINE DATA ROOM ======================
exports.approveDataRoom = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { approved } = req.body; // true = approve, false = decline

    const startup = await Startup.findOne({
      "investorConnections._id": connectionId,
    }).populate("investorConnections.investor", "fullName email");

    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    // Must be the founder
    if (startup.founder.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the founder can approve data room access",
      });
    }

    const connection = startup.investorConnections.id(connectionId);
    if (!connection) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    if (connection.status !== "interest_expressed") {
      return res.status(400).json({
        success: false,
        message:
          "Can only approve data room for interest_expressed connections",
      });
    }

    if (approved) {
      connection.dataRoomApproved = true;
      connection.lastActivityAt = new Date();
      await startup.save();

      // Notify investor
      const investorEmail = connection.investor?.email;
      if (investorEmail) {
        await sendEmail({
          to: investorEmail,
          subject: `Data Room Approved – ${startup.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0d9488;">Data Room Access Approved</h2>
              <p>The founder of <strong>${startup.companyName}</strong> has approved your data room access.</p>
              <p>You can now advance the deal to "Data Room Accessed" and review the startup's documents.</p>
            </div>
          `,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Data room access approved",
        data: connection,
      });
    } else {
      // Preserve the connection with declined status
      connection.status = "declined";
      connection.declinedAt = new Date();
      connection.declineReason = "Declined by founder at data room stage";
      connection.lastActivityAt = new Date();
      await startup.save();

      // Notify investor
      const investorEmail = connection.investor?.email;
      if (investorEmail) {
        await sendEmail({
          to: investorEmail,
          subject: `Interest Declined – ${startup.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #64748b;">Interest Declined</h2>
              <p>The founder of <strong>${startup.companyName}</strong> has declined your interest at this time.</p>
            </div>
          `,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Interest declined and connection marked as declined",
      });
    }
  } catch (error) {
    console.error("Approve data room error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
// ====================== FOUNDER: APPROVE / DECLINE TERM SHEET ======================
exports.approveTermSheet = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { approved } = req.body;

    const startup = await Startup.findOne({
      "investorConnections._id": connectionId,
    }).populate("investorConnections.investor", "fullName email");

    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    if (startup.founder.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the founder can approve the term sheet",
      });
    }

    const connection = startup.investorConnections.id(connectionId);
    if (!connection) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    if (connection.status !== "term_sheet") {
      return res.status(400).json({
        success: false,
        message: "Term sheet approval is only valid at the term_sheet stage",
      });
    }

    if (approved) {
      connection.termSheetApproved = true;
      connection.lastActivityAt = new Date();
      await startup.save();

      const investorEmail = connection.investor?.email;
      if (investorEmail) {
        await sendEmail({
          to: investorEmail,
          subject: `Term Sheet Approved – ${startup.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0d9488;">Term Sheet Approved</h2>
              <p>The founder of <strong>${startup.companyName}</strong> has approved the term sheet. You may now advance the deal to the execution stage.</p>
            </div>
          `,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Term sheet approved",
        data: connection,
      });
    } else {
      connection.status = "declined";
      connection.declinedAt = new Date();
      connection.declineReason = "Declined by founder at term sheet stage";
      connection.lastActivityAt = new Date();
      await startup.save();

      const investorEmail = connection.investor?.email;
      if (investorEmail) {
        await sendEmail({
          to: investorEmail,
          subject: `Term Sheet Declined – ${startup.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #64748b;">Term Sheet Declined</h2>
              <p>The founder of <strong>${startup.companyName}</strong> has declined the term sheet.</p>
            </div>
          `,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Term sheet declined and connection marked as declined",
      });
    }
  } catch (error) {
    console.error("Approve term sheet error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// ====================== FOUNDER: APPROVE / DECLINE DEAL EXECUTION ======================
exports.approveDealExecution = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { approved } = req.body;

    const startup = await Startup.findOne({
      "investorConnections._id": connectionId,
    }).populate("investorConnections.investor", "fullName email");

    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    if (startup.founder.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the founder can confirm deal execution",
      });
    }

    const connection = startup.investorConnections.id(connectionId);
    if (!connection) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    const validStages = [
      "investment_executed",
      "grant_disbursed",
      "guarantee_issued",
    ];
    if (!validStages.includes(connection.status)) {
      return res.status(400).json({
        success: false,
        message:
          "Deal execution confirmation is only valid after investment/grant/guarantee",
      });
    }

    if (approved) {
      connection.dealExecutionApproved = true;
      connection.lastActivityAt = new Date();
      await startup.save();

      const investorEmail = connection.investor?.email;
      if (investorEmail) {
        await sendEmail({
          to: investorEmail,
          subject: `Deal Execution Confirmed – ${startup.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0d9488;">Deal Execution Confirmed</h2>
              <p>The founder of <strong>${startup.companyName}</strong> has confirmed the deal execution. The deal can now be closed.</p>
            </div>
          `,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Deal execution confirmed",
        data: connection,
      });
    } else {
      connection.status = "declined";
      connection.declinedAt = new Date();
      connection.declineReason = "Declined by founder at deal execution stage";
      connection.lastActivityAt = new Date();
      await startup.save();

      const investorEmail = connection.investor?.email;
      if (investorEmail) {
        await sendEmail({
          to: investorEmail,
          subject: `Deal Execution Declined – ${startup.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #64748b;">Deal Execution Declined</h2>
              <p>The founder of <strong>${startup.companyName}</strong> has declined the deal execution.</p>
            </div>
          `,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Deal execution declined and connection marked as declined",
      });
    }
  } catch (error) {
    console.error("Approve deal execution error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
// ====================== UPDATE CONNECTION DETAILS ======================
exports.updateConnectionDetails = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { investmentType, amount, currency, notes } = req.body;

    const startup = await Startup.findOne({
      "investorConnections._id": connectionId,
    });

    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    const connection = startup.investorConnections.id(connectionId);
    if (!connection) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    const isInvestor =
      connection.investor.toString() === req.user._id.toString();
    const isFounder = startup.founder.toString() === req.user._id.toString();

    if (!isInvestor && !isFounder) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (investmentType) connection.investmentType = investmentType;
    if (amount !== undefined)
      connection.amount = amount ? Number(amount) : null;
    if (currency) connection.currency = currency;
    if (notes) {
      connection.notes = connection.notes
        ? `${connection.notes}\n\n[${new Date().toLocaleDateString()}] ${notes}`
        : notes;
    }
    connection.lastActivityAt = new Date();

    await startup.save();

    res.status(200).json({
      success: true,
      message: "Connection details updated",
      data: connection,
    });
  } catch (error) {
    console.error("Update connection details error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// ====================== CONNECTION MESSAGING ======================
exports.sendConnectionMessage = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Message text is required" });
    }

    const startup = await Startup.findOne({
      "investorConnections._id": connectionId,
    });

    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    const connection = startup.investorConnections.id(connectionId);
    if (!connection) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    const isInvestor =
      connection.investor.toString() === req.user._id.toString();
    const isFounder = startup.founder.toString() === req.user._id.toString();

    if (!isInvestor && !isFounder) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    connection.messages.push({
      sender: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
    });
    connection.lastActivityAt = new Date();
    await startup.save();

    res.status(201).json({
      success: true,
      message: "Message sent",
      data: connection.messages[connection.messages.length - 1],
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getConnectionMessages = async (req, res) => {
  try {
    const { connectionId } = req.params;

    const startup = await Startup.findOne({
      "investorConnections._id": connectionId,
    }).populate("investorConnections.messages.sender", "fullName email role");

    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    const connection = startup.investorConnections.id(connectionId);
    if (!connection) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    const isInvestor =
      connection.investor.toString() === req.user._id.toString();
    const isFounder = startup.founder.toString() === req.user._id.toString();

    if (!isInvestor && !isFounder) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    res.status(200).json({
      success: true,
      count: connection.messages.length,
      data: connection.messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// ====================== VERIFY TRANSFER ======================
exports.verifyTransfer = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { action } = req.body;

    if (!["request", "approve", "decline", "reset"].includes(action)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    const startup = await Startup.findOne({
      "investorConnections._id": connectionId,
    });

    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    const connection = startup.investorConnections.id(connectionId);
    if (!connection) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    const isInvestor =
      connection.investor.toString() === req.user._id.toString();
    const isFounder = startup.founder.toString() === req.user._id.toString();
    if (!isInvestor && !isFounder) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const allowedStatuses = [
      "investment_executed",
      "grant_disbursed",
      "guarantee_issued",
      "closed",
    ];
    if (!allowedStatuses.includes(connection.status)) {
      return res.status(400).json({
        success: false,
        message: "Transfer verification only available after deal execution",
      });
    }

    if (action === "reset") {
      connection.transferVerified = false;
      connection.transferRequestedBy = null;
      connection.transferRequestedAt = null;
      connection.lastActivityAt = new Date();
      await startup.save();
      return res.status(200).json({
        success: true,
        message: "Transfer verification reset",
        data: connection,
      });
    }

    if (action === "request") {
      if (connection.transferVerified) {
        return res
          .status(400)
          .json({ success: false, message: "Transfer already verified" });
      }
      if (connection.transferRequestedBy) {
        return res.status(400).json({
          success: false,
          message: "Transfer request already pending",
        });
      }
      connection.transferRequestedBy = req.user._id;
      connection.transferRequestedAt = new Date();
      connection.lastActivityAt = new Date();
      await startup.save();
      return res.status(200).json({
        success: true,
        message: "Transfer verification requested",
        data: connection,
      });
    }

    if (action === "approve" || action === "decline") {
      const requesterId = connection.transferRequestedBy?.toString();
      if (!requesterId) {
        return res
          .status(400)
          .json({ success: false, message: "No pending transfer request" });
      }
      if (requesterId === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "You cannot approve your own request",
        });
      }

      if (action === "approve") {
        connection.transferVerified = true;
        connection.transferRequestedBy = null;
        connection.transferRequestedAt = null;
      } else {
        connection.transferRequestedBy = null;
        connection.transferRequestedAt = null;
      }
      connection.lastActivityAt = new Date();
      await startup.save();
      return res.status(200).json({
        success: true,
        message:
          action === "approve"
            ? "Transfer verified"
            : "Transfer verification declined",
        data: connection,
      });
    }
  } catch (error) {
    console.error("Verify transfer error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// ====================== GENERATE CONNECTION DOCUMENT ======================
exports.generateConnectionDocument = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { documentType } = req.body; // 'term_sheet' or 'investment_agreement'

    if (!["term_sheet", "investment_agreement"].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid documentType. Use term_sheet or investment_agreement",
      });
    }

    const startup = await Startup.findOne({
      "investorConnections._id": connectionId,
    })
      .populate("founder", "fullName email")
      .populate("investorConnections.investor", "fullName email organization");

    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    const connection = startup.investorConnections.id(connectionId);
    if (!connection) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    // Auth: only founder or the connected investor
    const isInvestor =
      connection.investor._id.toString() === req.user._id.toString();
    const isFounder =
      startup.founder._id.toString() === req.user._id.toString();
    if (!isInvestor && !isFounder) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // Build PDF content (formal layout)
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const pdfPromise = new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    const docTitle =
      documentType === "term_sheet" ? "TERM SHEET" : "INVESTMENT AGREEMENT";

    // Letterhead
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Ministry of Innovation and Technology", { align: "center" })
      .fontSize(10)
      .font("Helvetica")
      .text("Digital Innovation Hub", { align: "center" })
      .moveDown(0.5)
      .text("Proclamation No. 1396/2025", { align: "center" })
      .moveDown(1);

    // Title
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(docTitle, { align: "center", underline: true })
      .moveDown(1);

    // Metadata
    doc
      .fontSize(9)
      .font("Helvetica")
      .text(`Generated: ${new Date().toLocaleString()}`)
      .text(`Document Type: ${docTitle}`)
      .moveDown(1);

    // Horizontal line
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor("#999")
      .stroke()
      .moveDown(1);

    // Parties section
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Parties", { underline: true })
      .moveDown(0.5)
      .fontSize(10)
      .font("Helvetica")
      .text(`Startup: ${startup.companyName}`)
      .text(`Founder: ${startup.founder?.fullName || "—"}`)
      .text(`Investor: ${connection.investor?.fullName || "—"}`);
    if (connection.investor?.organization) {
      doc.text(`Investor Organization: ${connection.investor.organization}`);
    }
    doc.moveDown(1);

    // Deal Details in table-like layout
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Deal Details", { underline: true })
      .moveDown(0.5)
      .fontSize(10)
      .font("Helvetica");

    const details = [
      ["Stage", connection.status],
      ["Investment Type", connection.investmentType || "Not specified"],
      [
        "Amount",
        connection.amount ? `${connection.amount} ${connection.currency}` : "—",
      ],
      ["Notes", connection.notes || "—"],
    ];

    details.forEach(([label, value]) => {
      doc
        .text(`${label}:`, { continued: true, width: 120 })
        .text(value, { indent: 10 });
    });
    doc.moveDown(1);

    // Terms / Agreement content
    if (documentType === "term_sheet") {
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Proposed Terms", { underline: true })
        .moveDown(0.5)
        .fontSize(10)
        .font("Helvetica");
      const terms = [
        "1. Investment amount and valuation to be agreed upon.",
        "2. Equity stake and governance rights subject to due diligence.",
        "3. Founder approval required before execution.",
        "4. This term sheet is non-binding until final agreement is signed.",
      ];
      terms.forEach((t) => doc.text(t));
    } else {
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Investment Agreement", { underline: true })
        .moveDown(0.5)
        .fontSize(10)
        .font("Helvetica");
      const agreementLines = [
        "This document confirms the agreement between the parties.",
        "The investor agrees to provide the funds described above.",
        "The startup agrees to issue equity or other instruments as agreed.",
        "Both parties confirm that all terms have been accepted.",
      ];
      agreementLines.forEach((line) => doc.text(line));
    }
    doc.moveDown(2);

    // Signature blocks
    const signatureY = doc.y;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Founder Signature", 50, signatureY)
      .text("Investor Signature", 350, signatureY)
      .moveDown(2);
    doc
      .moveTo(50, signatureY + 40)
      .lineTo(200, signatureY + 40)
      .strokeColor("#999")
      .stroke()
      .moveTo(350, signatureY + 40)
      .lineTo(500, signatureY + 40)
      .strokeColor("#999")
      .stroke();

    // Footer
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(
        "This document is generated electronically by the MinT Digital Innovation Hub and is valid without a physical signature.",
        50,
        doc.page.height - 50,
        { align: "center", width: 500 },
      );

    doc.end();
    const pdfBuffer = await pdfPromise;

    // Upload PDF to Cloudinary
    const uploadResult = await streamUpload(
      pdfBuffer,
      "mints/startups/documents",
    );

    // Save as Document in data room
    const generatedDoc = await Document.create({
      startup: startup._id,
      title: `${docTitle} - ${startup.companyName}`,
      originalName: `${startup.companyName}-${documentType}.pdf`,
      mimeType: "application/pdf",
      size: pdfBuffer.length,
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryUrl: uploadResult.secure_url,
      resourceType: uploadResult.resource_type || "raw",
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `${docTitle} generated successfully`,
      data: generatedDoc,
    });
  } catch (error) {
    console.error("Generate document error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// ====================== FOUNDER: SUBMIT ANNUAL REPORT ======================
exports.submitAnnualReport = async (req, res) => {
  try {
    const startup = await Startup.findOne({ founder: req.user._id });
    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Startup not found" });
    }

    if (startup.status !== "designated") {
      return res.status(400).json({
        success: false,
        message: "Only designated startups can submit annual reports",
      });
    }

    const { year, reportUrl } = req.body;
    if (!year || !reportUrl || !reportUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: "Year and report URL are required",
      });
    }

    const yearNum = Number(year);
    const existing = startup.annualReports.find((r) => r.year === yearNum);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Annual report for FY ${yearNum} already exists`,
      });
    }

    startup.annualReports.push({
      year: yearNum,
      reportUrl: reportUrl.trim(),
      submittedAt: new Date(),
      status: "pending",
    });
    startup.lastAnnualReportDate = new Date();
    await startup.save();

    await CaseDecision.create({
      entityType: "startup",
      entityId: startup._id,
      action: "submit_annual_report",
      reason: `Annual report submitted for FY ${yearNum}`,
      notes: reportUrl.trim(),
      actor: req.user._id,
      meta: { year: yearNum, reportUrl: reportUrl.trim() },
    });

    res.status(200).json({
      success: true,
      message: `Annual report for FY ${yearNum} submitted`,
      data: startup.annualReports,
    });
  } catch (error) {
    console.error("Submit annual report error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};
// ====================== FOUNDER: SUBMIT ANNUAL REPORT ======================
exports.submitAnnualReport = async (req, res) => {
  try {
    const startup = await Startup.findOne({ founder: req.user._id });
    if (!startup) {
      return res
        .status(404)
        .json({ success: false, message: "Startup not found" });
    }

    if (startup.status !== "designated") {
      return res.status(400).json({
        success: false,
        message: "Only designated startups can submit annual reports",
      });
    }

    const { year, reportUrl } = req.body;
    if (!year || !reportUrl || !reportUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: "Year and report URL are required",
      });
    }

    const yearNum = Number(year);
    const existing = startup.annualReports.find((r) => r.year === yearNum);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Annual report for FY ${yearNum} already exists`,
      });
    }

    startup.annualReports.push({
      year: yearNum,
      reportUrl: reportUrl.trim(),
      submittedAt: new Date(),
      status: "pending",
    });
    startup.lastAnnualReportDate = new Date();
    await startup.save();

    await CaseDecision.create({
      entityType: "startup",
      entityId: startup._id,
      action: "submit_annual_report",
      reason: `Annual report submitted for FY ${yearNum}`,
      notes: reportUrl.trim(),
      actor: req.user._id,
      meta: { year: yearNum, reportUrl: reportUrl.trim() },
    });

    res.status(200).json({
      success: true,
      message: `Annual report for FY ${yearNum} submitted`,
      data: startup.annualReports,
    });
  } catch (error) {
    console.error("Submit annual report error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};
