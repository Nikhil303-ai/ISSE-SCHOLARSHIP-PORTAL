const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// 1. REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, organization, college, branch } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = role === "admin" ? "admin" : "student";

    let assignedOrg = assignedRole === "admin" 
      ? (organization && organization.trim() ? organization.trim() : "General Provider")
      : (college && college.trim() ? college.trim() : "General Student");

    let assignedCollege = assignedRole === "admin" ? assignedOrg : (college && college.trim() ? college.trim() : "Any");
    let assignedBranch = assignedRole === "admin" ? "Administration" : (branch && branch.trim() ? branch.trim() : "Any");

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: assignedRole,
      organization: assignedOrg,
      college: assignedCollege,
      branch: assignedBranch,
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role, organization: user.organization },
      process.env.JWT_SECRET || "isse_secret_key_2026",
      { expiresIn: "7d" }
    );

    const userObj = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      college: user.college,
      branch: user.branch,
    };

    return res.status(201).json({
      ...userObj,
      user: userObj,
      token,
    });
  } catch (error) {
    console.error("Register error:", error.message);
    return res.status(500).json({ message: error.message || "Server error during registration" });
  }
});

// 2. LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash || user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, organization: user.organization },
      process.env.JWT_SECRET || "isse_secret_key_2026",
      { expiresIn: "7d" }
    );

    const userObj = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      college: user.college,
      branch: user.branch,
    };

    return res.status(200).json({
      ...userObj,
      user: userObj,
      token,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;