const mongoose = require("mongoose");

const productSpecSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    specKey: { type: String, required: true, trim: true, index: true },
    specValue: { type: String, required: true, trim: true, index: true },
  },
  { timestamps: true },
);

productSpecSchema.index({ product: 1, specKey: 1 });

module.exports = mongoose.model("ProductSpec", productSpecSchema);
