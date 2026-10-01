const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");
const Scholarship = require("./models/Scholarship");

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      console.error("❌ MONGODB_URI is missing in your .env file!");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB Atlas for seeding...");

    const passwordHash = await bcrypt.hash("admin123", 10);
    const studentPasswordHash = await bcrypt.hash("student123", 10);

    // 1. Create PSIT Admin Account
    let psitAdmin = await User.findOne({ email: "psitadmin@isse.edu" });
    if (!psitAdmin) {
      psitAdmin = await User.create({
        name: "PSIT Admin Cell",
        email: "psitadmin@isse.edu",
        password: passwordHash,
        role: "admin",
        organization: "PSIT Kanpur",
        college: "PSIT Kanpur",
        branch: "Administration",
      });
      console.log("✅ PSIT Admin Created: psitadmin@isse.edu / admin123");
    }

    // 2. Create UP Government Admin Account
    let govtAdmin = await User.findOne({ email: "govtadmin@isse.edu" });
    if (!govtAdmin) {
      govtAdmin = await User.create({
        name: "UP Scholarship Authority",
        email: "govtadmin@isse.edu",
        password: passwordHash,
        role: "admin",
        organization: "UP Government",
        college: "UP Govt Portal",
        branch: "Administration",
      });
      console.log("✅ UP Govt Admin Created: govtadmin@isse.edu / admin123");
    }

    // 3. Create Sample PSIT Student Account
    let psitStudent = await User.findOne({ email: "student@psit.in" });
    if (!psitStudent) {
      psitStudent = await User.create({
        name: "Rahul Verma",
        email: "student@psit.in",
        password: studentPasswordHash,
        role: "student",
        organization: "PSIT Kanpur",
        college: "PSIT Kanpur",
        branch: "Computer Science & Engineering",
      });
      console.log("✅ PSIT Student Created: student@psit.in / student123");
    }

    // 4. Create Sample PSIT Scholarship
    const samplePsitSch = await Scholarship.findOne({ title: "PSIT B.Tech CSE Merit Excellence Award" });
    if (!samplePsitSch) {
      await Scholarship.create({
        title: "PSIT B.Tech CSE Merit Excellence Award",
        provider: "PSIT Kanpur",
        description: "Merit-based financial aid for top performing B.Tech Computer Science students at PSIT Kanpur.",
        amount: 45000,
        category: "General",
        eligibility: {
          minPercentage: 80,
          maxIncome: 300000,
          colleges: ["PSIT Kanpur"],
          branches: ["Computer Science & Engineering"],
          categories: ["General", "OBC", "SC", "ST"],
          states: ["Uttar Pradesh"],
          courses: ["B.Tech"],
        },
        source: "PSIT Circular Notice",
        createdBy: psitAdmin._id,
      });
      console.log("✅ PSIT Merit Scholarship Inserted");
    }

    // 5. Create Sample Govt Scholarship
    const sampleGovtSch = await Scholarship.findOne({ title: "UP Post-Matric Scholarship Scheme 2026" });
    if (!sampleGovtSch) {
      await Scholarship.create({
        title: "UP Post-Matric Scholarship Scheme 2026",
        provider: "UP Government",
        description: "State government fee reimbursement and stipend scheme for domicile students of Uttar Pradesh.",
        amount: 50000,
        category: "General",
        eligibility: {
          minPercentage: 60,
          maxIncome: 250000,
          colleges: ["Any"],
          branches: ["Any"],
          categories: ["OBC", "SC", "ST", "EWS"],
          states: ["Uttar Pradesh"],
          courses: ["B.Tech", "B.Pharm", "MBA", "MCA"],
        },
        source: "UP Govt Portal",
        createdBy: govtAdmin._id,
      });
      console.log("✅ UP Govt Scholarship Inserted");
    }

    console.log("🎉 All accounts & sample scholarship data seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedData();