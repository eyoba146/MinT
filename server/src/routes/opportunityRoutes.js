const express = require('express');
const {
  createOpportunity,
  getOpportunities,
  getOpportunity,
  updateOpportunity,
  deleteOpportunity,
  approveOpportunity,
  rejectOpportunity,
  getMyOpportunities,
} = require('../controllers/opportunityController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All opportunity routes require login → visible only to logged-in users
router.use(protect);

router.get('/', getOpportunities);
router.get('/my', restrictTo('investor', 'admin', 'moderator'), getMyOpportunities);
router.get('/:id', getOpportunity);

// Moderator, admin, investor can create (controller enforces rules)
router.post('/', restrictTo('admin', 'moderator', 'investor'), createOpportunity);

// Moderator + admin control visibility
router.patch('/:id/approve', restrictTo('admin', 'moderator'), approveOpportunity);
router.patch('/:id/reject', restrictTo('admin', 'moderator'), rejectOpportunity);
router.put('/:id', restrictTo('admin', 'moderator'), updateOpportunity);
router.delete('/:id', restrictTo('admin', 'moderator'), deleteOpportunity);

module.exports = router;