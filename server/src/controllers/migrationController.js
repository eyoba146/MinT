const Startup = require('../models/Startup');
const DesignationCertificate = require('../models/DesignationCertificate');
const CaseDecision = require('../models/CaseDecision');
const { addWorkingDays } = require('../services/eligibilityService');

function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function makeCertificateNumber(startupId) {
  const year = new Date().getFullYear();
  const short = String(startupId).slice(-6).toUpperCase();
  return `MINT-DES-${year}-${short}`;
}

/**
 * Admin-only one-time style migration helper.
 * - Backfills designation fields for old verified startups
 * - Ensures certificate records exist
 * - Sets submittedAt/reviewDueAt for pending ones missing them
 */
exports.migrateStartupDesignationData = async (req, res) => {
  try {
    const summary = {
      verifiedBackfilled: 0,
      certificatesCreated: 0,
      pendingBackfilled: 0,
      skipped: 0,
    };

    const verified = await Startup.find({
      status: { $in: ['verified', 'designated'] },
    });

    for (const startup of verified) {
      let changed = false;
      const verifiedAt = startup.verifiedAt || startup.createdAt || new Date();

      if (!startup.designatedAt) {
        startup.designatedAt = verifiedAt;
        changed = true;
      }
      if (!startup.designationExpiresAt) {
        startup.designationExpiresAt = addYears(verifiedAt, 2);
        changed = true;
      }
      if (!startup.designationMaxUntil) {
        startup.designationMaxUntil = addYears(verifiedAt, 8);
        changed = true;
      }
      if (!startup.certificateNumber) {
        startup.certificateNumber = makeCertificateNumber(startup._id);
        changed = true;
      }
      if (!startup.submittedAt) {
        startup.submittedAt = startup.createdAt || verifiedAt;
        changed = true;
      }

      if (changed) {
        await startup.save();
        summary.verifiedBackfilled += 1;
      } else {
        summary.skipped += 1;
      }

      const existingCert = await DesignationCertificate.findOne({
        startup: startup._id,
      });

      if (!existingCert) {
        await DesignationCertificate.create({
          startup: startup._id,
          certificateNumber: startup.certificateNumber,
          startupName: startup.companyName,
          founderNames: '',
          growthStage: startup.fundingStage || '',
          sector: startup.sector || '',
          issuedAt: startup.designatedAt || verifiedAt,
          expiresAt: startup.designationExpiresAt,
          issuedBy: req.user._id,
          status: 'active',
        });
        summary.certificatesCreated += 1;
      }
    }

    const pending = await Startup.find({
      status: { $in: ['pending', 'submitted', 'under_review'] },
      $or: [{ submittedAt: null }, { reviewDueAt: null }],
    });

    for (const startup of pending) {
      if (!startup.submittedAt) startup.submittedAt = startup.createdAt || new Date();
      if (!startup.reviewDueAt) {
        startup.reviewDueAt = addWorkingDays(startup.submittedAt, 30);
      }
      await startup.save();
      summary.pendingBackfilled += 1;
    }

    await CaseDecision.create({
      entityType: 'startup',
      entityId: req.user._id, // operator marker
      action: 'request_info',
      reason: 'Ran designation data migration helper',
      notes: JSON.stringify(summary),
      actor: req.user._id,
      meta: summary,
    });

    res.status(200).json({
      success: true,
      message: 'Migration completed',
      data: summary,
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};