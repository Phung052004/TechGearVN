const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    sku: { type: String, trim: true, unique: true, sparse: true, index: true },

    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    stockQuantity: { type: Number, default: 0, min: 0 },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", index: true },

    thumbnail: { type: String, required: true },
    images: [{ type: String }], // Array of image URLs (detail images)
    description: { type: String },

    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },

    // Backward-compatible fields (so existing FE/data don't instantly break)
    // TODO: remove after FE migration
    image: { type: String },
    oldPrice: { type: Number },
    subCategory: { type: String },
    countInStock: { type: Number },
    discount: { type: Number },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
