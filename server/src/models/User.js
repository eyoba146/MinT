const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: [
        "founder",
        "investor",
        "admin",
        "citizen",
        "ecosystem_builder",
        "reviewer",
        "moderator",
      ],
      default: "founder",
    },
    companyName: String,
    organization: {
      type: String,
      trim: true,
    },
    organizationName: {
      type: String,
      trim: true,
    },
    builderType: {
      type: String,
      enum: [
        "incubator",
        "accelerator",
        "coworking",
        "angel_network",
        "university",
        "research",
        "ngo",
        "other",
        "",
      ],
      default: "",
    },
    investmentRange: {
      type: String,
      trim: true,
    },
    focus: {
      type: [String],
      default: [],
    },
    verificationStatus: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
    },
    verificationDocuments: [
      {
        documentType: { type: String, required: true },
        cloudinaryUrl: { type: String, required: true },
        originalName: { type: String, default: "" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    verificationNotes: { type: String, default: "" },
    verifiedAt: { type: Date, default: null },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetCode: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    lastVerificationSentAt: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
