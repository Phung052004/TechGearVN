const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { Readable } = require("stream");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage - files will be uploaded to Cloudinary in controller
const storage = multer.memoryStorage();

// Setup multer with file size limit
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ hỗ trợ file ảnh (JPEG, PNG, WebP, GIF)"));
    }
  },
});

// Upload to Cloudinary from memory buffer
async function uploadToCloudinary(file, folder = "techgear/products") {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      reject(new Error("No file provided"));
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: `${Date.now()}-${file.originalname
          .split(".")
          .slice(0, -1)
          .join(".")}`,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    Readable.from(file.buffer).pipe(stream);
  });
}

module.exports = {
  cloudinary,
  storage,
  upload,
  uploadToCloudinary,
};
