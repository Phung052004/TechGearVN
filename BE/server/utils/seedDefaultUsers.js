const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function seedDefaultUsers() {
  const defaultPassword = process.env.DEFAULT_STAFF_PASSWORD || "user123456";

  const defaultUsers = [
    {
      fullName: "Admin",
      email: process.env.DEFAULT_ADMIN_EMAIL || "admin@gmail.com",
      role: "ADMIN",
    },
    {
      fullName: "Staff",
      email: process.env.DEFAULT_STAFF_EMAIL || "staff@gmail.com",
      role: "STAFF",
    },
    {
      fullName: "Delivery",
      email: process.env.DEFAULT_DELIVERY_EMAIL || "delivery@gmail.com",
      role: "DELIVERY",
    },
  ];

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  for (const userData of defaultUsers) {
    await User.findOneAndUpdate(
      { email: userData.email },
      {
        $setOnInsert: {
          fullName: userData.fullName,
          email: userData.email,
          password: passwordHash,
          role: userData.role,
          isVerified: true,
          isBlocked: false,
          authProvider: "local",
        },
      },
      {
        upsert: true,
        new: false,
        setDefaultsOnInsert: true,
      },
    );
  }

  console.log("Default users check completed (ADMIN/STAFF/DELIVERY).");
}

module.exports = seedDefaultUsers;
