const mongoose = require("mongoose");

const userAddressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true }, // VD: "Nhà", "Công ty"
    fullName: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    addressLine: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Stored as hash (bcrypt). Kept as "password" to avoid breaking existing code.
    password: { type: String, required: true },
    // Social login (optional)
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: { type: String, index: true, sparse: true },
    avatarUrl: { type: String },
    phone: { type: String },
    address: { type: String },
    provinceCity: { type: String },
    // New: allow storing multiple addresses
    addresses: { type: [userAddressSchema], default: [] },
    role: {
      type: String,
      enum: ["CUSTOMER", "STAFF", "ADMIN", "DELIVERY"],
      default: "CUSTOMER",
    },
    isBlocked: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    emailVerifyToken: String,
    emailVerifyExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
