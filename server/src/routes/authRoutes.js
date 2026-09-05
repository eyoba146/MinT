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
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/login", login);
router.post("/verify-reset-code", verifyResetCode);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

module.exports = router;
