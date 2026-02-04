/* file: server/seedAdmin.js */
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const User = require("./models/User");

async function seedAdmin() {
  if (!process.env.MONGO_URI) {
    console.warn(
      "⚠️  MONGO_URI is missing. Using fallback mongodb://localhost:27017/TechGearDB",
    );
    process.env.MONGO_URI = "mongodb://localhost:27017/TechGearDB";
  }

  await connectDB();
  console.log("✅ Connected DB");

  const email = "admin@gmail.com";
  const plainPassword = "admin123";

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(plainPassword, salt);

  const updated = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        fullName: "Admin",
        email,
        password: passwordHash,
        role: "ADMIN",
        isVerified: true,
        isBlocked: false,
      },
      $setOnInsert: { createdAt: new Date() },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  ).select("-password");

  console.log(
    `✅ Admin user ready: ${updated.email} (role=${updated.role}, id=${updated._id})`,
  );

  await mongoose.connection.close();
}

seedAdmin().catch(async (err) => {
  console.error("❌ seedAdmin failed:", err);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore
  }
  process.exit(1);
});
