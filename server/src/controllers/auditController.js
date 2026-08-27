const CaseDecision = require('../models/CaseDecision');

// GET /api/audit-logs
// Admin only. Optional filters: entityType, entityId, action
exports.getAuditLogs = async (req, res) => {
  try {
    const { entityType, entityId, action, limit = 50 } = req.query;
    const filter = {};

    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    if (action) filter.action = action;

    const logs = await CaseDecision.find(filter)
      .populate('actor', 'fullName email role')
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 200));

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// GET /api/audit-logs/startup/:id
exports.getStartupAuditTrail = async (req, res) => {
  try {
    const logs = await CaseDecision.find({
      entityType: 'startup',
      entityId: req.params.id,
    })
      .populate('actor', 'fullName email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error('Get startup audit trail error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};