const express = require('express');
const {
  uploadDocument,
  getMyDocuments,
  getStartupDocuments,
  downloadDocument,
  deleteDocument,
} = require('../controllers/documentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', restrictTo('founder'), upload.single('file'), uploadDocument);
router.get('/my', restrictTo('founder'), getMyDocuments);
router.delete('/:id', restrictTo('founder'), deleteDocument);

router.get('/startup/:startupId', getStartupDocuments);
router.get('/:id/download', downloadDocument);

module.exports = router;