const paymentService = require("../services/paymentService");

exports.createVnpayPayment = async (req, res) => {
  try {
    const result = await paymentService.createVnpayPayment({
      user: req.user,
      orderId: req.params.orderId,
      ipAddr:
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        "127.0.0.1",
    });
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.vnpayReturn = async (req, res) => {
  try {
    const result = await paymentService.handleVnpayReturn(req.query);
    return res.redirect(result.redirectUrl);
  } catch (error) {
    const redirectUrl = paymentService.buildFrontendResultUrl({
      provider: "VNPAY",
      success: false,
      message: error.message,
    });
    return res.redirect(redirectUrl);
  }
};

const createMomoPayment = async (req, res) => {
  try {
    const result = await paymentService.createMomoPayment({
      user: req.user,
      orderId: req.params.orderId,
    });
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

// Keep both export names to avoid breaking existing imports
exports.createMomoPayment = createMomoPayment;
exports.createMoMoPayment = createMomoPayment;

exports.momoReturn = async (req, res) => {
  try {
    const result = await paymentService.handleMomoReturn(req.query);
    return res.redirect(result.redirectUrl);
  } catch (error) {
    const redirectUrl = paymentService.buildFrontendResultUrl({
      provider: "MOMO",
      success: false,
      message: error.message,
    });
    return res.redirect(redirectUrl);
  }
};

exports.mockMarkPaid = async (req, res) => {
  try {
    const result = await paymentService.mockMarkPaid({
      user: req.user,
      orderId: req.params.orderId,
    });
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.createPayosPayment = async (req, res) => {
  try {
    const result = await paymentService.createPayosPayment({
      user: req.user,
      orderId: req.params.orderId,
    });
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.payosReturn = async (req, res) => {
  try {
    const result = await paymentService.handlePayosReturn(req.query);
    return res.redirect(result.redirectUrl);
  } catch (error) {
    const redirectUrl = paymentService.buildFrontendResultUrl({
      provider: "PAYOS",
      success: false,
      message: error.message,
    });
    return res.redirect(redirectUrl);
  }
};

exports.payosCancel = async (req, res) => {
  try {
    const result = await paymentService.handlePayosCancel(req.query);
    return res.redirect(result.redirectUrl);
  } catch (error) {
    const redirectUrl = paymentService.buildFrontendResultUrl({
      provider: "PAYOS",
      success: false,
      message: error.message,
    });
    return res.redirect(redirectUrl);
  }
};

exports.payosWebhook = async (req, res) => {
  try {
    const result = await paymentService.handlePayosWebhook(req.body);
    return res.json(result);
  } catch (error) {
    const status = error.statusCode || 400;
    return res.status(status).json({ message: error.message });
  }
};

// Get payment history for an order
exports.getOrderPayments = async (req, res) => {
  try {
    const { orderId } = req.params;
    const Payment = require("../models/Payment");
    const Order = require("../models/Order");

    // Verify user owns the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const payments = await Payment.find({ order: orderId }).sort({
      createdAt: -1,
    });
    return res.json(payments);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

// Get payment details
exports.getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const Payment = require("../models/Payment");
    const Order = require("../models/Order");

    const payment = await Payment.findById(paymentId).populate("order");
    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy payment" });
    }

    // Verify user owns the order
    if (String(payment.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    return res.json(payment);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};
