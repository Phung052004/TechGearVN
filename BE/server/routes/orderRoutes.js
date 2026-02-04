const express = require("express");
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, createOrder);
router.get("/me", protect, getMyOrders);
router.get("/:id", protect, getOrderById);

router.get("/", protect, authorize("ADMIN", "STAFF", "DELIVERY"), getAllOrders);
router.put(
  "/:id/status",
  protect,
  authorize("ADMIN", "STAFF", "DELIVERY"),
  updateOrderStatus,
);

module.exports = router;
