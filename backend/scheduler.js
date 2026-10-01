
const cron = require("node-cron");

const Scholarship = require("./models/Scholarship");
const Application = require("./models/Application");
const SavedScholarship = require("./models/SavedScholarship");
const Notification = require("./models/Notification");

const createDeadlineNotifications = async () => {
  try {
    const now = new Date();
    const reminderDays = [10, 3, 1];

    for (const daysBefore of reminderDays) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysBefore);

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const scholarships = await Scholarship.find({
        deadline: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });

      for (const scholarship of scholarships) {
        // Find students with an active application.
        const applications = await Application.find({
          scholarshipId: scholarship._id,
          status: {
            $nin: ["approved", "rejected"],
          },
        });

        // Find students who saved the scholarship.
        const savedRecords = await SavedScholarship.find({
          scholarshipId: scholarship._id,
        });

        // Combine recipients and avoid duplicates by user ID.
        const userIds = new Set();

        for (const application of applications) {
          userIds.add(String(application.userId));
        }

        for (const savedRecord of savedRecords) {
          userIds.add(String(savedRecord.userId));
        }

        const reminderMessage =
          `${scholarship.title} deadline is in ${daysBefore} day(s).`;

        for (const userId of userIds) {
          const existingNotification = await Notification.findOne({
            userId,
            scholarshipId: scholarship._id,
            type: "deadline",
            message: reminderMessage,
            scheduledAt: scholarship.deadline,
          });

          if (existingNotification) {
            continue;
          }

          await Notification.create({
            userId,
            scholarshipId: scholarship._id,
            type: "deadline",
            title: "Scholarship Deadline Reminder",
            message: reminderMessage,
            scheduledAt: scholarship.deadline,
          });

          console.log(
            `Created ${daysBefore}-day reminder for ${scholarship.title}`
          );
        }
      }
    }
  } catch (error) {
    console.error("Deadline scheduler error:", error.message);
  }
};

// Run every day at 9:00 AM.
cron.schedule("0 9 * * *", () => {
  console.log("Running deadline notification scheduler...");
  createDeadlineNotifications();
});

module.exports = createDeadlineNotifications;