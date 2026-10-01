const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Scholarship = require("./models/Scholarship");
const Application = require("./models/Application");
const SavedScholarship = require("./models/SavedScholarship");
const User = require("./models/User");

const clearData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for database cleanup...");

    await Scholarship.deleteMany({});
    await Application.deleteMany({});
    await SavedScholarship.deleteMany({});
    await User.deleteMany({}); // 🔥 Deletes all existing user accounts

    console.log("🔥 Successfully wiped all existing users, scholarships, applications, and saved listings!");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup Error:", error);
    process.exit(1);
  }
};

clearData();