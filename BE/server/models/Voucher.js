const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ["PERCENT", "FIXED_AMOUNT"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },

    minOrderValue: { type: Number, default: 0, min: 0 },
    maxDiscountAmount: { type: Number, min: 0 },

    startDate: { type: Date },
    endDate: { type: Date },

    usageLimit: { type: Number, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },

    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Voucher", voucherSchema);
