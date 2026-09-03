const mongoose = require("mongoose");

const clarificationSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now },
    response: { type: String, default: "" },
    respondedAt: { type: Date, default: null },
    resolved: { type: Boolean, default: false },
  },
  { _id: true },
);

const evaluationScoreSchema = new mongoose.Schema(
  {
    innovation: { type: Number, min: 1, max: 5, default: null },
    scalability: { type: Number, min: 1, max: 5, default: null },
    technology: { type: Number, min: 1, max: 5, default: null },
    marketImpact: { type: Number, min: 1, max: 5, default: null },
    economicValue: { type: Number, min: 1, max: 5, default: null },
    overall: { type: Number, min: 1, max: 5, default: null },
  },
  { _id: false },
);

const investorConnectionSchema = new mongoose.Schema(
  {
    investor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    connectedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: [
        "interest_expressed",
        "data_room_accessed",
        "meeting_scheduled",
        "due_diligence",
        "term_sheet",
        "investment_executed",
        "grant_disbursed",
        "guarantee_issued",
        "closed",
        "declined",
      ],
      default: "interest_expressed",
    },
    dataRoomApproved: {
      type: Boolean,
      default: false,
    },
    termSheetApproved: {
      type: Boolean,
      default: false,
    },
    dealExecutionApproved: {
      type: Boolean,
      default: false,
    },
    declinedAt: { type: Date, default: null },
    declineReason: { type: String, default: "" },
    investmentType: {
      type: String,
      enum: [
        "none_yet",
        "equity",
        "grant",
        "convertible_note",
        "venture_debt",
        "credit_guarantee",
      ],
      default: "none_yet",
    },
    amount: { type: Number, default: null },
    currency: { type: String, default: "ETB" },
    notes: { type: String, default: "" },
    lastActivityAt: { type: Date, default: Date.now },
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: { type: String, required: true, maxlength: 2000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    transferVerified: {
      type: Boolean,
      default: false,
    },
    transferEvidenceUrl: {
      type: String,
      default: null,
    },
  },
  { _id: true },
);

const grantRecordSchema = new mongoose.Schema(
  {
    grantProgram: { type: String, required: true },
    amount: { type: Number, required: true },
    purpose: { type: String, required: true },
    approvedAt: { type: Date, default: null },
    disbursedAt: { type: Date, default: null },
    reportDueAt: { type: Date, default: null },
    reportSubmittedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["approved", "disbursed", "report_pending", "closed"],
      default: "approved",
    },
  },
  { _id: true },
);

const annualReportSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    reportUrl: { type: String, default: "" },
    submittedAt: { type: Date, default: null },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "flagged"],
      default: "pending",
    },
    notes: { type: String, default: "" },
  },
  { _id: true },
);

const startupSchema = new mongoose.Schema(
  {
    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    logo: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: 500,
    },
    oneLineDescription: {
      type: String,
      maxlength: 500,
      default: "",
    },
    productServiceType: {
      type: String,
      enum: ["product", "service", "process"],
      required: true,
    },
    fundingStage: {
      type: String,
      enum: ["Idea", "Pre-seed", "Seed", "Series A", "Growth"],
      required: true,
    },
    sector: {
      type: String,
      enum: [
        "FinTech",
        "AgriTech",
        "EdTech",
        "HealthTech",
        "LogisticsTech",
        "CleanTech",
        "E-commerce",
        "SaaS",
        "AI/ML",
        "Other",
      ],
      required: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      default: "Ethiopia",
    },
    location: {
      type: String,
      required: true,
    },
    teamSize: {
      type: Number,
      default: 1,
    },
    foundedYear: {
      type: Number,
    },
    website: {
      type: String,
    },

    problemStatement: {
      type: String,
      required: [true, "Problem statement is required"],
    },
    solutionStatement: {
      type: String,
      required: [true, "Solution statement is required"],
    },
    innovationDescription: {
      type: String,
      required: [true, "Describe the innovation per Proclamation Art. 7 & 12"],
    },
    techEnabledDescription: {
      type: String,
      required: [true, "Describe how technology is utilized per Art. 7(21)"],
    },
    scalabilityDescription: {
      type: String,
      required: [true, "Describe scalability per Art. 7(17)"],
    },
    marketChangingDescription: {
      type: String,
      required: [true, "Describe market-changing nature per Art. 7"],
    },
    economicValueFactors: {
      type: [String],
      enum: [
        "efficiency_productivity",
        "job_creation",
        "export_growth",
        "innovation",
        "social_welfare",
      ],
      default: [],
    },

    founderOwnershipPercent: {
      type: Number,
      min: 0,
      max: 100,
      required: [true, "Founder must hold at least 25% per Art. 7(2)(b)"],
    },
    isPublicCompany: {
      type: Boolean,
      default: false,
    },
    dateEstablished: {
      type: Date,
      default: null,
    },
    hasBusinessLicense: {
      type: Boolean,
      default: false,
    },
    legalStructure: {
      type: String,
      enum: [
        "sole_proprietorship",
        "private_limited_company",
        "partnership",
        "share_company",
        "other",
      ],
      default: "other",
    },

    productOwnershipDeclaration: {
      type: Boolean,
      default: false,
    },
    affidavitUrl: {
      type: String,
      default: null,
    },

    businessLicenseUrl: {
      type: String,
      default: null,
    },
    isForeignStartup: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "under_review",
        "clarification_needed",
        "designated",
        "rejected",
        "suspended",
        "revoked",
        "expired",
      ],
      default: "draft",
    },

    reviewOutcome: {
      type: String,
      enum: [null, "approved", "needs_clarification", "rejected"],
      default: null,
    },
    reviewerRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    evaluationScores: {
      type: evaluationScoreSchema,
      default: () => ({}),
    },
    clarificationRequests: {
      type: [clarificationSchema],
      default: [],
    },

    submittedAt: { type: Date, default: null },
    reviewDueAt: { type: Date, default: null },
    reviewStartedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    designatedAt: { type: Date, default: null },
    designationExpiresAt: { type: Date, default: null },
    renewalDueAt: { type: Date, default: null },
    suspendedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },

    designationId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },
    certificateNumber: { type: String, default: null },
    certificateUrl: { type: String, default: null },
    growthStageAtDesignation: {
      type: String,
      enum: ["idea", "pre_seed", "seed", "early_growth", "growth"],
      default: null,
    },

    rejectionReason: { type: String, default: "" },
    suspensionReason: { type: String, default: "" },
    revocationReason: { type: String, default: "" },
    reviewerNotes: { type: String, default: "" },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    investorConnections: {
      type: [investorConnectionSchema],
      default: [],
    },
    grantsReceived: {
      type: [grantRecordSchema],
      default: [],
    },
    annualReports: {
      type: [annualReportSchema],
      default: [],
    },
    lastAnnualReportDate: { type: Date, default: null },
    complianceStatus: {
      type: String,
      enum: ["compliant", "report_pending", "suspended", "revoked"],
      default: "compliant",
    },

    dataRoomAccessCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

startupSchema.index({ status: 1, createdAt: -1 });
startupSchema.index({ sector: 1, status: 1 });
startupSchema.index({ founder: 1 });
startupSchema.index({ country: 1 });
startupSchema.index({ designationId: 1 });
startupSchema.index({ "investorConnections.investor": 1 });

module.exports = mongoose.model("Startup", startupSchema);
