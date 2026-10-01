const mongoose = require("mongoose");

const savedScholarshipSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

// Prevent the same student from saving the same scholarship twice
savedScholarshipSchema.index(
  { userId: 1, scholarshipId: 1 },
  { unique: true }
);

const SavedScholarship = mongoose.model(
  "SavedScholarship",
  savedScholarshipSchema
);

module.exports = SavedScholarship;