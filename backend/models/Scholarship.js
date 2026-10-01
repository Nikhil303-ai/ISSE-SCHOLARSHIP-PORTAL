const mongoose = require("mongoose");

const scholarshipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    provider: {
      type: String,
      required: true,
      trim: true, // e.g., "PSIT Kanpur" or "UP Government"
    },

    description: {
      type: String,
      required: true,
    },

    officialUrl: {
      type: String,
      default: "https://isse.portal.edu",
    },

    amount: {
      type: Number,
      default: 0,
    },

    eligibility: {
      minPercentage: {
        type: Number,
        default: null,
      },

      maxIncome: {
        type: Number,
        default: null,
      },

      colleges: {
        type: [String],
        default: ["Any"], // e.g., ["PSIT Kanpur"] or ["Any"]
      },

      branches: {
        type: [String],
        default: ["Any"], // e.g., ["Computer Science & Engineering", "Information Technology"] or ["Any"]
      },

      categories: {
        type: [String],
        default: [],
      },

      states: {
        type: [String],
        default: [],
      },

      courses: {
        type: [String],
        default: [],
      },

      gender: {
        type: String,
        default: "Any",
      },

      educationLevel: {
        type: [String],
        default: [],
      },

      boards: {
        type: [String],
        default: [],
      },

      requiredClass12Percentile: {
        type: Number,
        default: null,
      },

      institutionConditions: {
        type: [String],
        default: [],
      },

      otherConditions: {
        type: [String],
        default: [],
      },
    },

    benefits: {
      type: [String],
      default: [],
    },

    documents: {
      type: [String],
      default: [],
    },

    applicationProcess: {
      type: [String],
      default: [],
    },

    applicationStart: {
      type: Date,
      default: null,
    },

    deadline: {
      type: Date,
      default: null,
    },

    source: {
      type: String,
      default: "Manual Admin / AI Extractor",
    },

    verificationStatus: {
      type: String,
      enum: ["verified", "pending", "expired"],
      default: "verified",
    },

    lastVerified: {
      type: Date,
      default: Date.now,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Scholarship = mongoose.model("Scholarship", scholarshipSchema);

module.exports = Scholarship;