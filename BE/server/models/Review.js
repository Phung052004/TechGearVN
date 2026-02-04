const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    images: { type: [String], default: [] },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "HIDDEN"],
      default: "PENDING",
      index: true,
    },
    reply: { type: String, trim: true },
  },
  { timestamps: true },
);

reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
