const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const pendingRegistrationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, required: true },
    organization: { type: String, default: "", trim: true },
    investmentRange: { type: String, default: "", trim: true },
    focus: { type: [String], default: [] },
    emailVerificationCode: { type: String, required: true, select: false },
    emailVerificationExpires: { type: Date, required: true, select: false },
    lastVerificationSentAt: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

pendingRegistrationSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.model("PendingRegistration", pendingRegistrationSchema);
