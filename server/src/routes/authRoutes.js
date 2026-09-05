const express = require("express");
const {
  register,
  login,
  updateProfile,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerification,
  verifyResetCode,
  submitVerification,
  getVerificationStatus,
  getPendingVerifications,
  reviewVerification,
} = require("../controllers/authController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public
router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-reset-code", verifyResetCode);

// Protected
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

// Verification (founder/investor/builder)
router.post(
  "/verification",
  protect,
  upload.single("file"),
  submitVerification,
);
router.get("/verification", protect, getVerificationStatus);

// Admin/reviewer verification review
router.get(
  "/admin/verifications",
  protect,
  restrictTo("reviewer"),
  getPendingVerifications,
);
router.patch(
  "/admin/verifications/:userId",
  protect,
  restrictTo("reviewer"),
  reviewVerification,
);
module.exports = router;
