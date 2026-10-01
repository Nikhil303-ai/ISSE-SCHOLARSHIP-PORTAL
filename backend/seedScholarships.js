const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Scholarship = require("./models/Scholarship");

dotenv.config();

const scholarships = [
  {
    title:
      "PM-USP Central Sector Scheme of Scholarship for College and University Students",

    provider:
      "Ministry of Education, Government of India",

    description:
      "Merit-based scholarship scheme for college and university students.",

    officialUrl:
      "https://scholarships.gov.in/",

    eligibility: {
      minPercentage: null,
      maxIncome: 800000,

      categories: [
        "General",
        "OBC",
        "SC",
        "ST"
      ],

      states: [],

      courses: [],

      gender: "Any",

      educationLevel: [
        "Undergraduate"
      ],

      boards: [],

      requiredClass12Percentile: null,

      institutionConditions: [
        "Eligibility depends on merit and the scheme's Class XII board-specific criteria.",
        "Student must be pursuing a regular course in a recognized institution as specified by the scheme."
      ],

      otherConditions: [
        "Fresh and renewal eligibility must be checked against the current official scheme guidelines.",
        "NSP One Time Registration is required."
      ]
    },

    benefits: [
      "Scholarship assistance as specified under the current PM-USP CSSS guidelines."
    ],

    documents: [
      "Documents specified by NSP and the current scheme guidelines."
    ],

    applicationProcess: [
      "Complete NSP One Time Registration.",
      "Login to the National Scholarship Portal.",
      "Select the applicable scholarship scheme.",
      "Complete and submit the application.",
      "Complete institute and other required verification."
    ],

    applicationStart: new Date("2026-06-01"),

    deadline: new Date("2026-10-31T23:59:59.000Z"),

    source:
      "National Scholarship Portal",

    verificationStatus: "verified",

    lastVerified: new Date("2026-09-17")
  },

  {
    title:
      "AICTE - Swanath Scholarship Scheme (Technical Degree)",

    provider:
      "All India Council for Technical Education",

    description:
      "Scholarship scheme for eligible students pursuing technical degree programmes.",

    officialUrl:
      "https://scholarships.gov.in/",

    eligibility: {
      minPercentage: null,
      maxIncome: null,

      categories: [],

      states: [],

      courses: [
        "B.Tech"
      ],

      gender: "Any",

      educationLevel: [
        "Undergraduate"
      ],

      boards: [],

      requiredClass12Percentile: null,

      institutionConditions: [
        "Eligibility must be checked against the current AICTE Swanath Scholarship guidelines."
      ],

      otherConditions: [
        "The scheme has specific beneficiary conditions.",
        "Only eligible students meeting the current AICTE conditions should be treated as eligible."
      ]
    },

    benefits: [
      "Financial assistance as specified under the current AICTE Swanath Scholarship guidelines."
    ],

    documents: [
      "Documents specified by AICTE and NSP."
    ],

    applicationProcess: [
      "Complete NSP One Time Registration.",
      "Login to the National Scholarship Portal.",
      "Select AICTE - Swanath Scholarship Scheme.",
      "Complete and submit the application.",
      "Complete required verification."
    ],

    applicationStart: new Date("2026-06-01"),

    deadline: new Date("2026-10-31T23:59:59.000Z"),

    source:
      "National Scholarship Portal",

    verificationStatus: "verified",

    lastVerified: new Date("2026-09-17")
  },

  {
    title:
      "Central Sector Scholarship of Top Class Education for SC Students",

    provider:
      "Ministry of Social Justice and Empowerment, Government of India",

    description:
      "Scholarship scheme providing financial support to eligible SC students pursuing studies beyond Class XII in empanelled institutions.",

    officialUrl:
      "https://socialjustice.gov.in/schemes/27",

    eligibility: {
      minPercentage: null,
      maxIncome: null,

      categories: [
        "SC"
      ],

      states: [],

      courses: [],

      gender: "Any",

      educationLevel: [
        "Undergraduate"
      ],

      boards: [],

      requiredClass12Percentile: null,

      institutionConditions: [
        "The student must study in an institution empanelled/notified under the scheme."
      ],

      otherConditions: [
        "Eligibility must be checked against the current 2026-27 scheme guidelines."
      ]
    },

    benefits: [
      "Financial support as specified in the current scheme guidelines."
    ],

    documents: [
      "Documents specified in the current scheme guidelines and NSP application."
    ],

    applicationProcess: [
      "Check whether the institution is covered by the scheme.",
      "Complete NSP One Time Registration.",
      "Apply through the National Scholarship Portal.",
      "Complete required institute and government verification."
    ],

    applicationStart: new Date("2026-06-01"),

    deadline: null,

    source:
      "Department of Social Justice and Empowerment",

    verificationStatus: "verified",

    lastVerified: new Date("2026-09-17")
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    await Scholarship.deleteMany({});

    await Scholarship.insertMany(scholarships);

    console.log(
      "Scholarship seed data inserted successfully"
    );

    await mongoose.disconnect();

    console.log("MongoDB connection closed");

  } catch (error) {
    console.error("Error seeding scholarships:");
    console.error(error.message);

    process.exit(1);
  }
};

seedDatabase();