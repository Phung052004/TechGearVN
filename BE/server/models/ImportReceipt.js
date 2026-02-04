const mongoose = require("mongoose");

const importReceiptDetailSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    importPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const importReceiptSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    totalCost: { type: Number, required: true, min: 0 },
    note: { type: String },
    details: { type: [importReceiptDetailSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ImportReceipt", importReceiptSchema);
