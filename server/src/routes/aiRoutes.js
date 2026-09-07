const express = require("express");
const {
  polishText,
  analyzeOpportunities,
} = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/polish", polishText);
router.post("/analyze", analyzeOpportunities);

module.exports = router;
