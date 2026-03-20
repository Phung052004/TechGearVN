const express = require("express");
const router = express.Router();
const { upload } = require("../utils/cloudinaryConfig");
const {
  uploadImage,
  deleteImage,
  viewImage,
} = require("../controllers/imageController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File quá lớn. Tối đa 5MB" });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message || "Upload lỗi" });
  }
  next();
};

// POST /api/v1/images/upload
// Body: { file: [binary], storage: "cloudinary" | "mongodb" }
router.post(
  "/upload",
  protect,
  upload.single("file"),
  handleMulterError,
  uploadImage,
);

// DELETE /api/images/delete
// Body: { publicId, storage: "cloudinary" | "mongodb" }
router.delete("/delete", protect, deleteImage);

// GET /api/images/view/:publicId
// View image from MongoDB storage
router.get("/view/:publicId", viewImage);

module.exports = router;
