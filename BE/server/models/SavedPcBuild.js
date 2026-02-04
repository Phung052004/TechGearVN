const mongoose = require("mongoose");

const savedPcBuildItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    // optional snapshots
    productName: { type: String },
    price: { type: Number },
    category: { type: String },
  },
  { _id: false },
);

const savedPcBuildSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    totalPrice: { type: Number, default: 0, min: 0 },
    shareLink: { type: String, unique: true, sparse: true, index: true },
    items: { type: [savedPcBuildItemSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SavedPcBuild", savedPcBuildSchema);
