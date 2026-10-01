const express = require("express");
const Scholarship = require("../models/Scholarship");

const router = express.Router();

// Create a scholarship
router.post("/", async (req, res) => {
  try {
    const scholarship = await Scholarship.create(req.body);

    res.status(201).json({
      message: "Scholarship created successfully",
      scholarship,
    });
  } catch (error) {
    console.error("Create scholarship error:", error.message);

    res.status(500).json({
      message: "Server error while creating scholarship",
    });
  }
});

// Get scholarships with search and filters
// Get scholarships with flexible search and filters
router.get("/", async (req, res) => {
  try {
    const {
      search,
      state,
      category,
      course,
      gender,
      maxIncome,
      minPercentage,
    } = req.query;

    const filter = {};

    // Search by scholarship title or provider (case-insensitive)
    if (search) {
      filter.$or = [
        { title: { $regex: search,$options: "i" } },
        { provider: { $regex: search,$options: "i" } },
      ];
    }

    // Filter by state (handles UP / Uttar Pradesh aliases + case-insensitive)
    if (state) {
      const cleanState = state.trim().toLowerCase();
      let stateRegex = cleanState;

      if (cleanState === "up" || cleanState === "uttar pradesh") {
        stateRegex = "uttar pradesh|up";
      }

      filter.$or = [
        { "eligibility.states": { $size: 0 } }, // Return all if no state restriction
        {
          "eligibility.states": {
            $elemMatch: { $regex: stateRegex,$options: "i" },
          },
        },
      ];
    }

    // Filter by category (case-insensitive)
    if (category) {
      filter.$or = [
        { "eligibility.categories": { $size: 0 } }, // Return all if no category restriction
        {
          "eligibility.categories": {
            $elemMatch: {$regex: `^${category.trim()}$`, $options: "i" },
          },
        },
      ];
    }

    // Filter by course (handles B.Tech / BTech / Bachelor of Technology aliases + case-insensitive)
    if (course) {
      const cleanCourse = course.trim().toLowerCase();
      let courseRegex = cleanCourse;

      if (
        cleanCourse === "b.tech" ||
        cleanCourse === "btech" ||
        cleanCourse === "bachelor of technology"
      ) {
        courseRegex = "b\\.tech|btech|bachelor of technology";
      }

      filter.$or = [
        { "eligibility.courses": { $size: 0 } }, // Return all if no course restriction
        {
          "eligibility.courses": {
            $elemMatch: { $regex: courseRegex,$options: "i" },
          },
        },
      ];
    }

    // Filter by gender (case-insensitive + matches "Any")
    if (gender) {
      filter["eligibility.gender"] = {
        $regex: `^(${gender.trim()}|Any)$`,
        $options: "i",
      };
    }

    // Filter by maximum income limit (student income <= scholarship maxIncome)
    if (maxIncome) {
      filter.$or = [
        { "eligibility.maxIncome": null },
        { "eligibility.maxIncome": { $gte: Number(maxIncome) } },
      ];
    }

    // Filter by minimum academic percentage (student percentage >= scholarship minPercentage)
    if (minPercentage) {
      filter.$or = [
        { "eligibility.minPercentage": null },
        { "eligibility.minPercentage": { $lte: Number(minPercentage) } },
      ];
    }

    const scholarships = await Scholarship.find(filter).sort({
      createdAt: -1,
    });

    res.status(200).json({
      count: scholarships.length,
      scholarships,
    });
  } catch (error) {
    console.error("Search scholarships error:", error.message);
    res.status(500).json({
      message: "Server error while searching scholarships",
    });
  }
});

// Get one scholarship
router.get("/:id", async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);

    if (!scholarship) {
      return res.status(404).json({
        message: "Scholarship not found",
      });
    }

    res.status(200).json({
      scholarship,
    });
  } catch (error) {
    console.error("Get scholarship error:", error.message);

    res.status(500).json({
      message: "Server error while fetching scholarship",
    });
  }
});

// Update a scholarship
router.put("/:id", async (req, res) => {
  try {
    const scholarship = await Scholarship.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!scholarship) {
      return res.status(404).json({
        message: "Scholarship not found",
      });
    }

    res.status(200).json({
      message: "Scholarship updated successfully",
      scholarship,
    });
  } catch (error) {
    console.error("Update scholarship error:", error.message);

    res.status(500).json({
      message: "Server error while updating scholarship",
    });
  }
});

// Delete a scholarship
router.delete("/:id", async (req, res) => {
  try {
    const scholarship = await Scholarship.findByIdAndDelete(
      req.params.id
    );

    if (!scholarship) {
      return res.status(404).json({
        message: "Scholarship not found",
      });
    }

    res.status(200).json({
      message: "Scholarship deleted successfully",
    });
  } catch (error) {
    console.error("Delete scholarship error:", error.message);

    res.status(500).json({
      message: "Server error while deleting scholarship",
    });
  }
});

module.exports = router;