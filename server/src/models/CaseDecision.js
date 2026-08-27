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
        'submit',
        'start_review',
        'approve',
        'reject',
        'suspend',
        'revoke',
        'renew',
        'request_info',
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