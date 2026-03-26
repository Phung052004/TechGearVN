const express = require("express");
const router = express.Router();

const {
  createVnpayPayment,
  vnpayReturn,
  createMomoPayment,
  momoReturn,
  mockMarkPaid,
  createPayosPayment,
  payosReturn,
  payosCancel,
  payosWebhook,
  getOrderPayments,
  getPaymentDetails,
} = require("../controllers/paymentController");

const { protect } = require("../middleware/authMiddleware");

// Create payment URLs
router.post("/vnpay/create/:orderId", protect, createVnpayPayment);
router.post("/momo/create/:orderId", protect, createMomoPayment);
router.post("/payos/create/:orderId", protect, createPayosPayment);

// Provider callbacks/returns (no auth)
router.get("/vnpay/return", vnpayReturn);
router.get("/momo/return", momoReturn);
router.get("/payos/return", payosReturn);
router.get("/payos/cancel", payosCancel);

// Payment info API (authenticated)
router.get("/orders/:orderId/payments", protect, getOrderPayments);
router.get("/:paymentId", protect, getPaymentDetails);

// PayOS server-to-server webhook
router.post("/payos/webhook", payosWebhook);

// Dev helper (optional)
router.post("/mock/success/:orderId", protect, mockMarkPaid);

module.exports = router;
