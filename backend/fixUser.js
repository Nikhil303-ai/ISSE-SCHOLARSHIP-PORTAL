const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");

const fixUserDatabaseDocument = async () => {
  try {
    console.log("Connecting to MongoDB Atlas...");
    // Check MONGO_URI, MONGODB_URI, or DATABASE_URL from .env
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      process.env.DATABASE_URL ||
      process.env.MONGO_URL;

    if (!mongoUri) {
      console.error("❌ Database URI missing! Please check the key name in your .env file.");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    const rawUser = await usersCollection.findOne({ email: "teststudent@isse.com" });

    if (!rawUser) {
      console.log("❌ User teststudent@isse.com not found!");
      process.exit(1);
    }

    // Standardize password field name and update role to admin
    const passwordValue = rawUser.password || rawUser.passwordHash;

    const updateResult = await usersCollection.updateOne(
      { email: "teststudent@isse.com" },
      {
        $set: {
          password: passwordValue,
          role: "admin",
        },
        $unset: {
          passwordHash: "",
        },
      }
    );

    console.log("✅ Successfully repaired user document in Atlas!");
    console.log("Modified Count:", updateResult.modifiedCount);
  } catch (error) {
    console.error("❌ Error fixing user document:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

fixUserDatabaseDocument();