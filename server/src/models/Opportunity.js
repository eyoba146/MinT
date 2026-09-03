const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "scholarship",
        "internship",
        "job",
        "training",
        "competition",
        "announcement",
        "grant",
        "credit_guarantee",
        "other",
      ],
      default: "announcement",
    },
    eligibleDesignatedOnly: {
      type: Boolean,
      default: false,
    },
    fundingAmount: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      default: "ETB",
    },
    programDetails: {
      type: String,
      trim: true,
      default: "",
    },
    deadline: {
      type: Date,
    },
    link: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    // pending = waiting admin approval (investor posts)
    // approved = visible to all logged-in users
    // rejected = hidden
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Opportunity", opportunitySchema);
