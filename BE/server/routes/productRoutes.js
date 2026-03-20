const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  getProductSpecs,
  replaceProductSpecs,
  uploadProductImage,
  deleteProductImage,
  updateProductThumbnail,
} = require("../controllers/productController");

const { protect, authorize } = require("../middleware/authMiddleware");
const {
  upload,
  uploadToCloudinary,
} = require("../middleware/uploadMiddleware");

router.get("/", getProducts); // Lấy danh sách
router.get("/:id", getProductById); // Lấy chi tiết
router.post("/", protect, authorize("ADMIN", "STAFF"), createProduct); // Tạo mới
router.put("/:id", protect, authorize("ADMIN", "STAFF"), updateProduct); // Cập nhật

router.get("/:id/specs", getProductSpecs);
router.put(
  "/:id/specs",
  protect,
  authorize("ADMIN", "STAFF"),
  replaceProductSpecs,
);

// --- IMAGE MANAGEMENT ---
router.post(
  "/upload-image",
  protect,
  authorize("ADMIN", "STAFF"),
  upload.single("file"),
  uploadToCloudinary,
  uploadProductImage,
);

router.delete(
  "/:id/images",
  protect,
  authorize("ADMIN", "STAFF"),
  deleteProductImage,
);

router.put(
  "/:id/thumbnail",
  protect,
  authorize("ADMIN", "STAFF"),
  updateProductThumbnail,
);

module.exports = router;
