const mongoose = require("mongoose");

const warrantyClaimSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderItemId: { type: String, required: true, trim: true },

    productSerialNumber: { type: String, trim: true },
    reason: { type: String, required: true, trim: true },
    imageProof: { type: [String], default: [] },

    status: {
      type: String,
      enum: [
        "PENDING",
        "RECEIVED_PRODUCT",
        "PROCESSING",
        "COMPLETED",
        "REJECTED",
      ],
      default: "PENDING",
      index: true,
    },
    resolution: { type: String, enum: ["REPAIR", "REPLACE", "REFUND"] },
    staffNote: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("WarrantyClaim", warrantyClaimSchema);
