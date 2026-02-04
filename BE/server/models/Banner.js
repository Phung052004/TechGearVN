const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    linkUrl: { type: String, trim: true },
    displayOrder: { type: Number, default: 0 },
    position: { type: String, default: "HOME_SLIDER", trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Banner", bannerSchema);
