const mongoose = require("mongoose");

const pendingRegistrationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },

    codeHash: { type: String, required: true },
    codeExpire: { type: Date, required: true },

    resendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "PendingRegistration",
  pendingRegistrationSchema,
);
