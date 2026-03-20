const { cloudinary, uploadToCloudinary } = require("../utils/cloudinaryConfig");
const Image = require("../models/Image");
const crypto = require("crypto");

/**
 * Upload image to selected storage (Cloudinary or MongoDB)
 * Query param: ?storage=cloudinary|mongodb (default: cloudinary)
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn file ảnh" });
    }

    const storage = (
      req.body.storage ||
      req.query.storage ||
      "cloudinary"
    ).toLowerCase();

    if (storage === "mongodb") {
      // Save to MongoDB
      const publicId = crypto.randomBytes(16).toString("hex");

      const image = new Image({
        filename: `${Date.now()}-${publicId}`,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer, // Multer stores file in memory with buffer
        publicId,
        uploadedBy: req.user?._id || null,
        url: `/api/images/view/${publicId}`, // endpoint để xem ảnh
      });

      await image.save();

      return res.status(201).json({
        message: "Upload ảnh thành công",
        url: image.url,
        publicId: image.publicId,
        originalName: image.originalName,
        storage: "mongodb",
      });
    } else {
      // Upload to Cloudinary (default)
      const result = await uploadToCloudinary(req.file);

      return res.status(201).json({
        message: "Upload ảnh thành công",
        url: result.secure_url,
        publicId: result.public_id,
        originalName: req.file.originalname,
        storage: "cloudinary",
      });
    }
  } catch (error) {
    console.error("uploadImage error:", error);
    return res.status(500).json({ message: error.message || "Upload lỗi" });
  }
};

/**
 * Delete image from selected storage
 * Body: { publicId, storage: "cloudinary"|"mongodb" }
 */
exports.deleteImage = async (req, res) => {
  try {
    const { publicId, storage } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: "publicId không được để trống" });
    }

    const storageType = (storage || "cloudinary").toLowerCase();

    if (storageType === "mongodb") {
      // Delete from MongoDB
      const image = await Image.findOneAndDelete({ publicId });

      if (!image) {
        return res.status(404).json({
          message: "Ảnh không tồn tại",
        });
      }

      return res.json({ message: "Xóa ảnh thành công", storage: "mongodb" });
    } else {
      // Delete from Cloudinary (default)
      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === "ok") {
        return res.json({
          message: "Xóa ảnh thành công",
          storage: "cloudinary",
        });
      } else {
        return res.status(400).json({
          message: "Không thể xóa ảnh",
        });
      }
    }
  } catch (error) {
    console.error("deleteImage error:", error);
    return res.status(500).json({ message: error.message || "Xóa ảnh lỗi" });
  }
};

/**
 * View image from MongoDB storage
 * Route: GET /api/images/view/:publicId
 */
exports.viewImage = async (req, res) => {
  try {
    const { publicId } = req.params;

    const image = await Image.findOne({ publicId });

    if (!image) {
      return res.status(404).json({ message: "Ảnh không tồn tại" });
    }

    // Set response headers
    res.setHeader("Content-Type", image.mimetype);
    res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year

    // Send image data
    res.send(image.data);
  } catch (error) {
    console.error("viewImage error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Lỗi khi xem ảnh" });
  }
};
