const express = require("express");
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  claimOrder,
  getDeliveryPeople,
  getDeliveryMetrics,
} = require("../controllers/orderController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, createOrder);
router.get("/me", protect, getMyOrders);
router.get("/:id", protect, getOrderById);

// Get delivery people list & metrics
router.get(
  "/staff/delivery-people",
  protect,
  authorize("ADMIN", "STAFF"),
  getDeliveryPeople,
);
router.get(
  "/staff/delivery-metrics",
  protect,
  authorize("ADMIN", "STAFF"),
  getDeliveryMetrics,
);

router.get("/", protect, authorize("ADMIN", "STAFF", "DELIVERY"), getAllOrders);

router.put("/:id/claim", protect, authorize("DELIVERY"), claimOrder);
router.put(
  "/:id/status",
  protect,
  authorize("ADMIN", "STAFF", "DELIVERY"),
  updateOrderStatus,
);

module.exports = router;
