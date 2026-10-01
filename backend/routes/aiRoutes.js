const express = require("express");
const axios = require("axios");

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

// Array route mapping allows both /api/recommendations AND /api/recommendations/recommend
router.post(["/recommend", "/"], async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/recommend`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error("AI service error:");

    if (error.response) {
      console.error(error.response.data);
      return res.status(error.response.status).json({
        message: "AI service returned an error",
        error: error.response.data,
      });
    }

    console.error(error.message);

    res.status(500).json({
      message: "Could not connect to AI service. Ensure FastAPI is running on port 8000.",
    });
  }
});

router.post("/chat", async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/chat`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error("Chatbot service error:", error.message);

    if (error.response) {
      console.error(error.response.data);
      return res.status(error.response.status).json({
        message: "Chatbot service returned an error",
        error: error.response.data,
      });
    }

    res.status(500).json({
      message: "Could not connect to the chatbot service. Ensure FastAPI is running on port 8000.",
    });
  }
});

module.exports = router;