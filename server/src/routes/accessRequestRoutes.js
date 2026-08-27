const express = require('express');
const {
  createRequest,
  getMyRequests,
  getIncomingRequests,
  approveRequest,
  denyRequest,
} = require('../controllers/accessRequestController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // all routes require login

// Investor
router.post('/', restrictTo('investor'), createRequest);
router.get('/my', restrictTo('investor'), getMyRequests);

// Founder
router.get('/incoming', restrictTo('founder'), getIncomingRequests);
router.patch('/:id/approve', restrictTo('founder'), approveRequest);
router.patch('/:id/deny', restrictTo('founder'), denyRequest);

module.exports = router;