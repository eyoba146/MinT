const express = require('express');
const {
  getAuditLogs,
  getStartupAuditTrail,
} = require('../controllers/auditController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/', getAuditLogs);
router.get('/startup/:id', getStartupAuditTrail);

module.exports = router;