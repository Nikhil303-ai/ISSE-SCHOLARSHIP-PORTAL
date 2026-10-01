const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Scholarship = require("../models/Scholarship");
const Application = require("../models/Application");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const sendStatusUpdateEmail = require("../utils/sendEmail");

const router = express.Router();

// Initialize Gemini AI for auto-extraction
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_FALLBACK_KEY");

// Helper function to re-index vector database via ai-service/rag/build_index.py
const syncVectorIndex = () => {
  const scriptPath = path.join(__dirname, "../../ai-service/rag/build_index.py");
  const venvPythonPath = path.join(__dirname, "../../ai-service/venv/Scripts/python.exe");

  exec(`"${venvPythonPath}" "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Vector Sync Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Vector Sync Stderr: ${stderr}`);
    }
    console.log(`AI Vector Store Index Updated Successfully:\n${stdout}`);
  });
};

// ==========================================
// 1. AI SCHOLARSHIP AUTO-EXTRACTOR ROUTE (WITH AUTO-FALLBACK)
// ==========================================
// POST /api/admin/extract-scholarship
router.post("/extract-scholarship", protect, adminOnly, async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({ message: "Raw text or announcement content is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "GEMINI_API_KEY is missing in backend .env file." });
    }

    const prompt = `
    You are an expert AI parser for academic scholarship portals.
    Extract key information from the following scholarship notice/announcement text and output strictly valid JSON with no extra commentary or markdown codeblocks outside the JSON.

    Notice Text:
    """${rawText}"""

    JSON format requirements:
    {
      "title": "Short descriptive title",
      "provider": "Name of college/provider (e.g. PSIT Kanpur, UP Government, AICTE)",
      "amount": Number (award amount in INR or 0 if unstated),
      "description": "2-3 sentence summary of the scholarship",
      "minAcademicPercentage": Number (e.g. 75 or 0),
      "maxAnnualIncome": Number (max family income in INR or 0),
      "college": "Target college or 'Any' (e.g. PSIT Kanpur)",
      "branch": "Target branch or 'Any' (e.g. Computer Science & Engineering)",
      "category": "General, OBC, SC, ST, or Any",
      "deadline": "YYYY-MM-DD string or empty"
    }
    `;

    // Priority candidate models: Primary -> Fallbacks to survive 503 traffic spikes
    const candidateModels = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
    let result = null;
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`Attempting AI Extraction with model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(prompt);
        if (result) break; // Successfully generated content!
      } catch (err) {
        console.warn(`⚠️ Model ${modelName} unavailable (${err.status || "Error"}). Attempting fallback...`);
        lastError = err;
      }
    }

    if (!result) {
      throw lastError || new Error("All AI models are currently experiencing high demand. Please try again in a moment.");
    }

    const responseText = result.response.text();
    
    // Clean up response string if markdown code blocks exist
    const cleanedText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const extractedData = JSON.parse(cleanedText);

    res.status(200).json({ success: true, data: extractedData });
  } catch (error) {
    console.error("AI Extractor Error Trace:", error);
    res.status(500).json({ 
      message: error.status === 503 
        ? "The AI service is temporarily experiencing high traffic. Please try clicking 'AI Extract & Pre-fill' again in 5 seconds." 
        : (error.message || "Failed to extract scholarship details using AI.")
    });
  }
});

// ==========================================
// 2. ISOLATED MULTI-TENANT APPLICATIONS ROUTE
// ==========================================
// GET /api/admin/applications - Strictly Filtered by Admin Organization
router.get("/applications", protect, adminOnly, async (req, res) => {
  try {
    const adminOrg = req.user.organization || req.user.college;

    let filter = {};
    
    // Case-insensitive regex matching to isolate organization applications
    if (adminOrg && adminOrg !== "SuperAdmin" && adminOrg !== "General") {
      const adminScholarships = await Scholarship.find({
        provider: { $regex: new RegExp(`^${adminOrg.trim()}$`, "i") },
      }).select("_id");

      const scholarshipIds = adminScholarships.map((s) => s._id);
      filter = { scholarshipId: { $in: scholarshipIds } };
    }

    const applications = await Application.find(filter)
      .populate("userId", "name email college branch")
      .populate("scholarshipId", "title provider category deadline eligibility amount")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Admin get applications error:", error.message);
    res.status(500).json({ message: "Server error fetching applications" });
  }
});

// ==========================================
// 3. ISOLATED MULTI-TENANT SCHOLARSHIPS ROUTE
// ==========================================
// GET /api/admin/scholarships - Fetch only scholarships belonging to Logged-in Admin
router.get("/scholarships", protect, adminOnly, async (req, res) => {
  try {
    const adminOrg = req.user.organization || req.user.college;

    let filter = {};
    if (adminOrg && adminOrg !== "SuperAdmin" && adminOrg !== "General") {
      filter = { provider: { $regex: new RegExp(`^${adminOrg.trim()}$`, "i") } };
    }

    const scholarships = await Scholarship.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      count: scholarships.length,
      scholarships,
    });
  } catch (error) {
    console.error("Admin get scholarships error:", error.message);
    res.status(500).json({ message: "Server error fetching scholarships" });
  }
});

// ==========================================
// 4. APPLICATION STATUS UPDATE ROUTE (WITH EMAIL ALERT)
// ==========================================
// PUT /api/admin/applications/:id/status - Admin update application status
router.put("/applications/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const application = await Application.findById(req.params.id)
      .populate("userId", "name email")
      .populate("scholarshipId", "title");

    if (!application) {
      return res.status(404).json({ message: "Application record not found" });
    }

    if (status) application.status = status;
    if (notes) application.notes = notes;

    await application.save();

    // Trigger Async Nodemailer Email Alert
    if (application.userId && application.userId.email) {
      sendStatusUpdateEmail(
        application.userId.email,
        application.userId.name,
        application.scholarshipId?.title || "Scholarship Application",
        application.status,
        application.notes
      );
    }

    res.status(200).json({
      message: "Application status updated successfully and student notified",
      application,
    });
  } catch (error) {
    console.error("Admin status update error:", error.message);
    res.status(500).json({ message: "Server error updating application status" });
  }
});

// ==========================================
// 5. CREATE SCHOLARSHIP (WITH COLLEGE & BRANCH)
// ==========================================
// POST /api/admin/scholarships - Create new scholarship & sync vector store
router.post("/scholarships", protect, adminOnly, async (req, res) => {
  try {
    const {
      title,
      provider,
      description,
      amount,
      category,
      minAcademicPercentage,
      maxAnnualIncome,
      college,
      branch,
      state,
      course,
      deadline,
      source,
      officialUrl,
    } = req.body;

    const scholarshipData = {
      title,
      provider: provider || req.user.organization || "General",
      description,
      amount: Number(amount) || 0,
      category: category || "General",
      eligibility: {
        minPercentage: Number(minAcademicPercentage) || 0,
        maxIncome: Number(maxAnnualIncome) || 0,
        colleges: college ? [college] : ["Any"],
        branches: branch ? [branch] : ["Any"],
        categories: category ? [category] : [],
        states: state ? [state] : [],
        courses: course ? [course] : [],
      },
      source: source || provider || "Admin Ingestion Portal",
      officialUrl: officialUrl || "https://isse.portal.edu",
      createdBy: req.user._id,
    };

    if (deadline) {
      scholarshipData.deadline = new Date(deadline);
    }

    const scholarship = await Scholarship.create(scholarshipData);

    // Trigger vector store re-index
    syncVectorIndex();

    res.status(201).json({
      message: "Scholarship created successfully and vector store synced",
      scholarship,
    });
  } catch (error) {
    console.error("Admin create scholarship error:", error.message);
    res.status(500).json({
      message: error.message || "Server error creating scholarship",
    });
  }
});

// ==========================================
// 6. UPDATE & DELETE SCHOLARSHIPS
// ==========================================
// PUT /api/admin/scholarships/:id - Update scholarship & sync vector store
router.put("/scholarships/:id", protect, adminOnly, async (req, res) => {
  try {
    const scholarship = await Scholarship.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!scholarship) {
      return res.status(404).json({ message: "Scholarship not found" });
    }

    // Sync Vector DB
    syncVectorIndex();

    res.status(200).json({
      message: "Scholarship updated successfully and vector store synced",
      scholarship,
    });
  } catch (error) {
    console.error("Admin update scholarship error:", error.message);
    res.status(500).json({ message: "Server error updating scholarship" });
  }
});

// DELETE /api/admin/scholarships/:id - Delete scholarship & sync vector store
router.delete("/scholarships/:id", protect, adminOnly, async (req, res) => {
  try {
    const scholarship = await Scholarship.findByIdAndDelete(req.params.id);

    if (!scholarship) {
      return res.status(404).json({ message: "Scholarship not found" });
    }

    // Sync Vector DB
    syncVectorIndex();

    res.status(200).json({
      message: "Scholarship deleted successfully and vector store updated",
    });
  } catch (error) {
    console.error("Admin delete scholarship error:", error.message);
    res.status(500).json({ message: "Server error deleting scholarship" });
  }
});

module.exports = router;