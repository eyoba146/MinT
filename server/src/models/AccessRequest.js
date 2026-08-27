const mongoose = require('mongoose');

const accessRequestSchema = new mongoose.Schema(
  {
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
      required: true,
    },
    investor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending',
    },
    message: {
      type: String,
      maxlength: 500,
    },
    // Optional extra info from investor
    ticketSize: {
      type: String,
    },
    focus: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Prevent duplicate pending requests from same investor to same startup
accessRequestSchema.index({ startup: 1, investor: 1 }, { unique: true });

module.exports = mongoose.model('AccessRequest', accessRequestSchema);