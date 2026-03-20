const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { Readable } = require("stream");
const path = require("path");
const fs = require("fs");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Store files in memory (we'll handle them in middleware)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ hỗ trợ file JPG, PNG, WebP, GIF"));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Fallback: Save to public folder if Cloudinary not configured
const saveToPublic = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    // Create directories if they don't exist
    const uploadDir = path.join(__dirname, "../../public/uploads/products");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = path.extname(req.file.originalname);
    const filename = `${timestamp}-${random}${ext}`;

    // Save file
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, req.file.buffer);

    // Set URL for controller to use
    const publicUrl = `/uploads/products/${filename}`;
    const fullUrl = `${process.env.BACKEND_URL || "http://localhost:5000"}${publicUrl}`;

    req.file.secure_url = fullUrl;
    req.file.path = fullUrl;
    next();
  } catch (error) {
    console.error("Save to public error:", error);
    return res.status(500).json({
      message: "Lỗi lưu tệp: " + error.message,
    });
  }
};

// Middleware to upload file to Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.warn("Cloudinary not configured, falling back to local storage");
    return saveToPublic(req, res, next);
  }

  try {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "techgearvn/products",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          // Fallback to local upload on Cloudinary error
          console.warn("Cloudinary failed, falling back to local storage");
          return saveToPublic(req, res, next);
        }
        req.file.secure_url = result.secure_url;
        req.file.path = result.secure_url;
        next();
      },
    );

    Readable.from(req.file.buffer).pipe(stream);
  } catch (error) {
    console.error("Upload stream error:", error);
    // Fallback to local upload on stream error
    return saveToPublic(req, res, next);
  }
};

module.exports = { upload, uploadToCloudinary };
