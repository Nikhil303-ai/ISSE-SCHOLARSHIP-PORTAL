const express = require("express");
const Notification = require("../models/Notification");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Get current user's notifications
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.userId,
    })
      .populate("scholarshipId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error.message
    );

    res.status(500).json({
      message: "Server error while fetching notifications",
    });
  }
});

// Create a notification
router.post("/", protect, async (req, res) => {
  try {
    const {
      scholarshipId,
      type,
      title,
      message,
      scheduledAt,
    } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        message: "Type, title and message are required",
      });
    }

    const notification = await Notification.create({
      userId: req.user.userId,
      scholarshipId: scholarshipId || null,
      type,
      title,
      message,
      scheduledAt: scheduledAt || null,
    });

    res.status(201).json({
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    console.error(
      "Create notification error:",
      error.message
    );

    res.status(500).json({
      message: "Server error while creating notification",
    });
  }
});

// Mark a notification as read
router.put("/:id/read", protect, async (req, res) => {
  try {
    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          userId: req.user.userId,
        },
        {
          read: true,
        },
        {
          new: true,
        }
      );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error.message
    );

    res.status(500).json({
      message: "Server error while updating notification",
    });
  }
});

// Delete a notification
router.delete("/:id", protect, async (req, res) => {
  try {
    const notification =
      await Notification.findOneAndDelete({
        _id: req.params.id,
        userId: req.user.userId,
      });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete notification error:",
      error.message
    );

    res.status(500).json({
      message: "Server error while deleting notification",
    });
  }
});

module.exports = router;