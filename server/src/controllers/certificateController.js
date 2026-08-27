const DesignationCertificate = require('../models/DesignationCertificate');
const Startup = require('../models/Startup');

// GET /api/certificates/my  (founder)
exports.getMyCertificate = async (req, res) => {
  try {
    const startup = await Startup.findOne({ founder: req.user._id });
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'No startup found for this founder',
      });
    }

    const cert = await DesignationCertificate.findOne({ startup: startup._id }).sort({
      issuedAt: -1,
    });

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'No designation certificate found yet',
      });
    }

    res.status(200).json({ success: true, data: cert });
  } catch (error) {
    console.error('Get my certificate error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// GET /api/certificates/:id
exports.getCertificateById = async (req, res) => {
  try {
    const cert = await DesignationCertificate.findById(req.params.id).populate(
      'issuedBy',
      'fullName email'
    );

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.status(200).json({ success: true, data: cert });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// GET /api/certificates/startup/:startupId
exports.getCertificateByStartup = async (req, res) => {
  try {
    const cert = await DesignationCertificate.findOne({
      startup: req.params.startupId,
    })
      .populate('issuedBy', 'fullName email')
      .sort({ issuedAt: -1 });

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.status(200).json({ success: true, data: cert });
  } catch (error) {
    console.error('Get certificate by startup error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// GET /api/certificates  (admin list)
exports.listCertificates = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const certs = await DesignationCertificate.find(filter)
      .populate('startup', 'companyName sector status')
      .populate('issuedBy', 'fullName email')
      .sort({ issuedAt: -1 });

    res.status(200).json({
      success: true,
      count: certs.length,
      data: certs,
    });
  } catch (error) {
    console.error('List certificates error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};