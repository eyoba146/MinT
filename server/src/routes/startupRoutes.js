const express = require("express");
const {
  createStartup,
  submitStartup,
  getMyStartup,
  updateMyStartup,
  getVerifiedStartups,
  getStartup,
  getStartupCase,
  getPendingStartups,
  submitReview,
  requestClarification,
  respondToClarification,
  suspendStartup,
  revokeStartup,
  requestRenewal,
  getAdminStats,
  getPublicStats,
  getAdminStartups,
  deleteStartup,
  startReview,
  expressInterest,
  getInvestorConnections,
} = require("../controllers/startupController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// ====================== PUBLIC ======================
router.get("/", getVerifiedStartups);
router.get("/public-stats", getPublicStats);

// ====================== AUTHENTICATED ======================
router.use(protect);

// ── Investor routes (specific paths BEFORE /:id catch-all) ──
router.get(
  "/investor/connections",
  restrictTo("investor"),
  getInvestorConnections,
);
router.post("/:id/express-interest", restrictTo("investor"), expressInterest);

// Founder — profile management (with file upload support)
router.post(
  "/",
  restrictTo("founder"),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "affidavit", maxCount: 1 },
  ]),
  createStartup,
);
router.get("/my", restrictTo("founder"), getMyStartup);
router.put(
  "/my",
  restrictTo("founder"),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "affidavit", maxCount: 1 },
  ]),
  updateMyStartup,
);
router.post("/my/submit", restrictTo("founder"), submitStartup);
router.post("/my/renew", restrictTo("founder"), requestRenewal);
router.post(
  "/my/clarification-response",
  restrictTo("founder"),
  respondToClarification,
);

// Admin / Reviewer / Moderator — lists & stats
router.get("/pending", restrictTo("admin", "reviewer"), getPendingStartups);
router.get(
  "/stats",
  restrictTo("admin", "reviewer", "moderator"),
  getAdminStats,
);
router.get(
  "/admin",
  restrictTo("admin", "reviewer", "moderator"),
  getAdminStartups,
);

// Admin / Reviewer — case review (specific routes BEFORE /:id)
router.get("/:id/case", restrictTo("admin", "reviewer"), getStartupCase);
router.patch("/:id/start-review", restrictTo("admin", "reviewer"), startReview);
router.patch(
  "/:id/request-clarification",
  restrictTo("admin", "reviewer"),
  requestClarification,
);
router.patch("/:id/review", restrictTo("admin", "reviewer"), submitReview);
router.patch("/:id/suspend", restrictTo("admin"), suspendStartup);
router.patch("/:id/revoke", restrictTo("admin"), revokeStartup);
router.delete("/:id", restrictTo("admin"), deleteStartup);

// Generic — must be LAST among /:id routes
router.get("/:id", getStartup);

module.exports = router;
