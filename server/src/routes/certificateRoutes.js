const express = require('express');
const {
  getMyCertificate,
  getCertificateById,
  getCertificateByStartup,
  listCertificates,
} = require('../controllers/certificateController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my', restrictTo('founder'), getMyCertificate);
router.get('/', restrictTo('admin'), listCertificates);
router.get('/startup/:startupId', getCertificateByStartup);
router.get('/:id', getCertificateById);

module.exports = router;