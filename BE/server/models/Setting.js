const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    shippingFee: { type: Number, default: 0, min: 0 },
    footer: {
      aboutText: { type: String, trim: true },
      addresses: { type: [String], default: [] },
      hotline: { type: String, trim: true },
      email: { type: String, trim: true },
      companyLine1: { type: String, trim: true },
      companyLine2: { type: String, trim: true },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Setting", settingsSchema);
