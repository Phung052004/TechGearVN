const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);
//cmt
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    shippingAddress: { type: String, required: true },

    paymentMethod: {
      type: String,
      enum: ["COD", "VNPAY", "MOMO", "PAYOS"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID"],
      default: "UNPAID",
    },

    orderStatus: {
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "SHIPPING",
        "COMPLETED",
        "DELIVERY_FAILED",
        "CANCELLED",
        "RETURNED",
      ],
      default: "PENDING",
    },

    totalAmount: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    finalAmount: { type: Number, required: true, min: 0 },
    note: { type: String },

    voucherCode: { type: String, trim: true },
    discountAmount: { type: Number, default: 0, min: 0 },

    items: { type: [orderItemSchema], required: true },

    // PayOS mapping fields (needed because PayOS orderCode is numeric).
    payosOrderCode: { type: Number, index: true },
    payosPaymentLinkId: { type: String, trim: true },

    // Delivery assignment
    deliveryAssignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
    deliveryClaimedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
