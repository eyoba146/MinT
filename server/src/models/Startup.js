const mongoose = require('mongoose');

const startupSchema = new mongoose.Schema(
  {
    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    logo: {
      type: String,
      default: 'Rocket',
    },
    oneLineDescription: {
      type: String,
      required: [true, 'One line description is required'],
      maxlength: 200,
    },
    sector: {
      type: String,
      enum: [
        'FinTech',
        'AgriTech',
        'EdTech',
        'HealthTech',
        'LogisticsTech',
        'CleanTech',
        'Other',
      ],
      required: true,
    },
    fundingStage: {
      type: String,
      enum: ['Idea', 'Pre-seed', 'Seed', 'Series A'],
      required: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'Ethiopia',
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
      required: [true, 'Problem statement is required'],
    },
    solutionStatement: {
      type: String,
      required: [true, 'Solution statement is required'],
    },

    founderOwnershipPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
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
    innovationDescription: {
      type: String,
      default: '',
    },
    productOwnershipDeclaration: {
      type: Boolean,
      default: false,
    },
    legalStructure: {
      type: String,
      enum: ['sole_proprietor', 'private_limited', 'partnership', 'other', ''],
      default: '',
    },

    status: {
      type: String,
      enum: [
        'draft',
        'pending',
        'submitted',
        'under_review',
        'verified',
        'designated',
        'rejected',
        'renewal_due',
        'suspended',
        'revoked',
        'expired',
      ],
      default: 'pending',
    },

    submittedAt: { type: Date, default: null },
    reviewDueAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    designatedAt: { type: Date, default: null },
    designationExpiresAt: { type: Date, default: null },
    designationMaxUntil: { type: Date, default: null },

    certificateNumber: { type: String, default: null },
    rejectionReason: { type: String, default: '' },
    suspensionReason: { type: String, default: '' },
    revocationReason: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    requestCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

startupSchema.index({ status: 1, createdAt: -1 });
startupSchema.index({ sector: 1, status: 1 });
startupSchema.index({ founder: 1 });
startupSchema.index({ country: 1 });

module.exports = mongoose.model('Startup', startupSchema);