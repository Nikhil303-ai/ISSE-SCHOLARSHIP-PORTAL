const User = require("../models/User");

const adminOnly = async (req, res, next) => {
  try {
    // 1. Safety check: ensure request was authenticated first
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized. Please log in first." });
    }

    // 2. Fast check: if authMiddleware already populated role on req.user
    if (req.user.role) {
      if (req.user.role === "admin") {
        return next();
      }
      return res.status(403).json({
        message: "Access denied. Administrator privileges required.",
      });
    }

    // 3. Fallback database lookup using any attached user ID key
    const userId = req.user.userId || req.user._id || req.user.id;
    const user = await User.findById(userId);

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Administrator privileges required.",
      });
    }

    // Attach role to req.user for subsequent middleware/handlers
    req.user.role = user.role;
    next();
  } catch (error) {
    console.error("Admin middleware error:", error.message);
    res.status(500).json({ message: "Server error checking permissions" });
  }
};

module.exports = adminOnly;