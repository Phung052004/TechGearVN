const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    // Base64 encoded image data
    data: {
      type: Buffer,
      required: true,
    },
    // URL for quick access (can be generated on-the-fly)
    url: {
      type: String,
    },
    // Metadata
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    publicId: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true },
);

// Indexing for faster queries
imageSchema.index({ publicId: 1 });
imageSchema.index({ uploadedBy: 1 });
imageSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Image", imageSchema);
