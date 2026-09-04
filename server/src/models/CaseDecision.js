const mongoose = require('mongoose');

const caseDecisionSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ['startup', 'ecosystem_builder'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    action: {
      type: String,
      enum: [
        'create',
        'submit',
        'start_review',
        'approve',
        'designate',
        'reject',
        'suspend',
        'revoke',
        'renew',
        'request_info',
        'request_clarification',
        'clarification_response',
        'review_needs_clarification',
        'submit_annual_report',
        'annual_report_review',
        'express_interest',
        'connection_stage_update',
        'delete',
      ],
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    meta: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

caseDecisionSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
caseDecisionSchema.index({ actor: 1, createdAt: -1 });

module.exports = mongoose.model('CaseDecision', caseDecisionSchema);
