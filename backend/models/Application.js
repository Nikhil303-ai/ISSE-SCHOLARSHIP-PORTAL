const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    scholarshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scholarship",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "saved",
        "documents_required",
        "applied",
        "under_review",
        "approved",
        "rejected",
      ],
      default: "saved",
    },

    appliedAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: "",
    },

    documents: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

applicationSchema.index(
  { userId: 1, scholarshipId: 1 },
  { unique: true }
);

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;