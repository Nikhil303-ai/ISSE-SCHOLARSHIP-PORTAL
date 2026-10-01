const express = require("express");
const SavedScholarship = require("../models/SavedScholarship");
const Scholarship = require("../models/Scholarship");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Helper handler for saving a scholarship
const handleSaveScholarship = async (req, res) => {
  try {
    const scholarshipId = req.params.scholarshipId || req.body.scholarshipId;
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!scholarshipId) {
      return res.status(400).json({ message: "Scholarship ID is required" });
    }

    const scholarship = await Scholarship.findById(scholarshipId);
    if (!scholarship) {
      return res.status(404).json({ message: "Scholarship not found" });
    }

    const existingSave = await SavedScholarship.findOne({
      userId,
      scholarshipId,
    });

    if (existingSave) {
      return res.status(409).json({ message: "Scholarship already saved" });
    }

    const savedScholarship = await SavedScholarship.create({
      userId,
      scholarshipId,
    });

    res.status(201).json({
      message: "Scholarship saved successfully",
      savedScholarship,
    });
  } catch (error) {
    console.error("Save scholarship error:", error.message);
    res.status(500).json({
      message: "Server error while saving scholarship",
    });
  }
};

// GET /api/saved-scholarships - Get student's saved scholarships
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    const savedScholarships = await SavedScholarship.find({ userId })
      .populate("scholarshipId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: savedScholarships.length,
      savedScholarships,
    });
  } catch (error) {
    console.error("Get saved scholarships error:", error.message);
    res.status(500).json({
      message: "Server error while fetching saved scholarships",
    });
  }
});

// POST /api/saved-scholarships (JSON body payload)
router.post("/", protect, handleSaveScholarship);

// POST /api/saved-scholarships/:scholarshipId (URL parameter payload)
router.post("/:scholarshipId", protect, handleSaveScholarship);

// DELETE /api/saved-scholarships/:scholarshipId - Remove saved scholarship
router.delete("/:scholarshipId", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    const deleted = await SavedScholarship.findOneAndDelete({
      userId,
      scholarshipId: req.params.scholarshipId,
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Saved scholarship not found",
      });
    }

    res.status(200).json({
      message: "Scholarship removed from saved list",
    });
  } catch (error) {
    console.error("Remove saved scholarship error:", error.message);
    res.status(500).json({
      message: "Server error while removing scholarship",
    });
  }
});

module.exports = router;