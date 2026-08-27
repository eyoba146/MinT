const mongoose = require('mongoose');

const designationCertificateSchema = new mongoose.Schema(
  {
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
      required: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
    },
    startupName: {
      type: String,
      required: true,
    },
    founderNames: {
      type: String,
      default: '',
    },
    growthStage: {
      type: String,
      default: '',
    },
    sector: {
      type: String,
      default: '',
    },
    issuedAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'revoked', 'suspended'],
      default: 'active',
    },
    pdfUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Only one extra index needed (unique already indexes certificateNumber)
designationCertificateSchema.index({ startup: 1 });

module.exports = mongoose.model(
  'DesignationCertificate',
  designationCertificateSchema
);