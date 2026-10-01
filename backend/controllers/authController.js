const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Helper function to generate JWT Token
const generateToken = (id, role, organization) => {
  return jwt.sign({ id, role, organization }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// ==========================================
// 1. REGISTER USER / ADMIN
// ==========================================
// POST /api/auth/register
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, organization, college, branch } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email address." });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Dynamic Organization and Role Parsing
    let finalRole = role;
    let finalOrg = organization ? organization.trim() : "";
    let finalCollege = college ? college.trim() : "";

    // FAILSAFE FORCE LOGIC: If email or role indicates Admin, force role = "admin"
    if (
      role === "admin" || 
      email.includes("admin") || 
      email.includes("scholarship") || 
      email.includes("gov")
    ) {
      finalRole = "admin";

      // If organization was empty or defaulted to PSIT/General, derive it properly
      if (!finalOrg || finalOrg === "General" || finalOrg === "PSIT Kanpur") {
        if (email.includes("up.gov") || name.toLowerCase().includes("up")) {
          finalOrg = "UP Government";
        } else if (email.includes("psit")) {
          finalOrg = "PSIT Kanpur";
        } else {
          finalOrg = organization.trim() || "UP Government";
        }
      }
      finalCollege = finalOrg;
    } else {
      finalRole = "student";
      finalOrg = finalCollege || "PSIT Kanpur";
    }

    // Create User / Admin Document in MongoDB
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: finalRole,
      organization: finalOrg,
      college: finalCollege,
      branch: finalRole === "admin" ? "Administration" : (branch ? branch.trim() : "Any"),
    });

    const token = generateToken(user._id, user.role, user.organization);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      college: user.college,
      branch: user.branch,
      token,
    });
  } catch (error) {
    console.error("Register Controller Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ==========================================
// 2. LOGIN USER / ADMIN
// ==========================================
// POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id, user.role, user.organization);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      college: user.college,
      branch: user.branch,
      token,
    });
  } catch (error) {
    console.error("Login Controller Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};