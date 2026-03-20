const mongoose = require("mongoose");

const warrantyClaimSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderItemId: { type: String, required: true, trim: true },

    productSerialNumber: { type: String, trim: true },
    reason: {
      type: String,
      required: true,
      trim: true,
      enum: ["BROKEN", "DEFECTIVE", "NOT_WORKING", "PHYSICAL_DAMAGE", "OTHER"],
    },
    description: { type: String, trim: true },
    imageProof: { type: [String], default: [] },

    status: {
      type: String,
      enum: [
        "PENDING", // Chờ nhân viên xem xét
        "RECEIVED_PRODUCT", // Nhân viên nhận được sản phẩm
        "PROCESSING", // Đang xử lý
        "COMPLETED", // Hoàn thành
        "REJECTED", // Từ chối
      ],
      default: "PENDING",
      index: true,
    },
    resolution: {
      type: String,
      enum: ["REPAIR", "REPLACE", "REFUND"],
      default: null,
    },
    staffNote: { type: String, trim: true },

    // Tracking
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completedAt: { type: Date },
    estimatedCompletionDate: { type: Date },
  },
  { timestamps: true },
);

// Index for query optimization
warrantyClaimSchema.index({ user: 1, status: 1 });
warrantyClaimSchema.index({ order: 1 });
warrantyClaimSchema.index({ createdAt: -1 });

module.exports = mongoose.model("WarrantyClaim", warrantyClaimSchema);
