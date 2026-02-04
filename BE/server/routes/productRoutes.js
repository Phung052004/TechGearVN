const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  getProductSpecs,
  replaceProductSpecs,
} = require("../controllers/productController");

const { protect, authorize } = require("../middleware/authMiddleware");

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

module.exports = router;
