const express = require("express");
const Application = require("../models/Application");
const Scholarship = require("../models/Scholarship");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const { upload, cloudinary } = require("../config/cloudinary");

const router = express.Router();

// Create an application tracking record with STRICT ELIGIBILITY CHECKING
router.post("/:scholarshipId", protect, async (req, res) => {
  try {
    const { scholarshipId } = req.params;

    const scholarship = await Scholarship.findById(scholarshipId);
    if (!scholarship) {
      return res.status(404).json({ message: "Scholarship not found" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // -------------------------------------------------------------
    // STRICT ELIGIBILITY ENFORCEMENT
    // -------------------------------------------------------------
    const minMarks =
      scholarship.eligibility?.minPercentage ?? scholarship.minAcademicPercentage ?? 0;
    const maxIncome =
      scholarship.eligibility?.maxIncome ?? scholarship.maxAnnualIncome ?? Infinity;

    // 1. Academic Marks Check
    if (user.academicPercentage !== undefined && user.academicPercentage < minMarks) {
      return res.status(400).json({
        message: `Ineligible: Required academic score is ${minMarks}%, but your profile has ${user.academicPercentage}%.`,
      });
    }

    // 2. Annual Income Check
    if (user.annualIncome !== undefined && maxIncome > 0 && user.annualIncome > maxIncome) {
      return res.status(400).json({
        message: `Ineligible: Maximum family income limit is ₹${maxIncome}, but your profile has ₹${user.annualIncome}.`,
      });
    }

    // 3. Category Check
    const allowedCategories =
      scholarship.eligibility?.categories?.length > 0
        ? scholarship.eligibility.categories
        : scholarship.category
        ? [scholarship.category]
        : [];

    if (
      user.category &&
      allowedCategories.length > 0 &&
      !allowedCategories.includes("Any") &&
      !allowedCategories.includes("General") &&
      !allowedCategories.includes(user.category)
    ) {
      return res.status(400).json({
        message: `Ineligible: This scholarship is reserved for ${allowedCategories.join(
          ", "
        )} category applicants.`,
      });
    }

    // 4. College/Organization Check
    const allowedColleges = scholarship.eligibility?.colleges || [];
    if (
      user.college &&
      allowedColleges.length > 0 &&
      !allowedColleges.includes("Any") &&
      !allowedColleges.some(
        (c) => c.toLowerCase().trim() === user.college.toLowerCase().trim()
      )
    ) {
      return res.status(400).json({
        message: `Ineligible: This scholarship is restricted to students from ${allowedColleges.join(
          ", "
        )}.`,
      });
    }

    // Check if application is already tracked
    const existingApplication = await Application.findOne({
      userId: req.user.userId,
      scholarshipId,
    });

    if (existingApplication) {
      return res.status(409).json({
        message: "Application is already being tracked.",
      });
    }

    const application = await Application.create({
      userId: req.user.userId,
      scholarshipId,
      status: "saved",
      documents: req.body.documents || [],
    });

    res.status(201).json({
      message: "Application tracking started successfully!",
      application,
    });
  } catch (error) {
    console.error("Create application error:", error.message);
    res.status(500).json({
      message: "Server error while creating application",
    });
  }
});

// Get current user's applications
router.get("/", protect, async (req, res) => {
  try {
    const applications = await Application.find({
      userId: req.user.userId,
    })
      .populate("scholarshipId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get applications error:", error.message);
    res.status(500).json({
      message: "Server error while fetching applications",
    });
  }
});

// Upload document to an application
router.post(
  "/:id/documents",
  protect,
  upload.single("document"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Please select a file to upload" });
      }

      const application = await Application.findOne({
        _id: req.params.id,
        userId: req.user.userId,
      });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const newDoc = {
        name: req.body.name || req.file.originalname,
        url: req.file.path,
        publicId: req.file.filename,
      };

      application.documents.push(newDoc);
      await application.save();

      res.status(200).json({
        message: "Document uploaded successfully",
        documents: application.documents,
      });
    } catch (error) {
      console.error("Upload document error:", error.message);
      res.status(500).json({ message: "Server error during document upload" });
    }
  }
);

// Delete a document from an application
router.delete("/:id/documents/:docId", protect, async (req, res) => {
  try {
    const { id, docId } = req.params;

    const application = await Application.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const docToDelete = application.documents.id(docId);
    if (!docToDelete) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (docToDelete.publicId) {
      await cloudinary.uploader.destroy(docToDelete.publicId);
    }

    application.documents.pull(docId);
    await application.save();

    res.status(200).json({
      message: "Document deleted successfully",
      documents: application.documents,
    });
  } catch (error) {
    console.error("Delete document error:", error.message);
    res.status(500).json({ message: "Server error while deleting document" });
  }
});

// Update application status and notes
router.put("/:id", protect, async (req, res) => {
  try {
    const { status, notes, appliedAt } = req.body;

    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    if (status !== undefined) application.status = status;
    if (notes !== undefined) application.notes = notes;
    if (appliedAt !== undefined) application.appliedAt = appliedAt;

    await application.save();

    res.status(200).json({
      message: "Application updated successfully",
      application,
    });
  } catch (error) {
    console.error("Update application error:", error.message);
    res.status(500).json({
      message: "Server error while updating application",
    });
  }
});

// Delete application tracking record
router.delete("/:id", protect, async (req, res) => {
  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    res.status(200).json({
      message: "Application tracking removed",
    });
  } catch (error) {
    console.error("Delete application error:", error.message);
    res.status(500).json({
      message: "Server error while deleting application",
    });
  }
});

module.exports = router;