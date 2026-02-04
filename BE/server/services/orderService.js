const Order = require("../models/Order");
const Product = require("../models/Product");
const { createHttpError } = require("../utils/httpError");
const voucherService = require("./voucherService");

async function createOrder(user, payload = {}) {
  const {
    items,
    fullName,
    phoneNumber,
    shippingAddress,
    paymentMethod,
    note,
    shippingFee,
    voucherCode,
  } = payload;

  if (!Array.isArray(items) || items.length === 0) {
    throw createHttpError(400, "Thiếu items");
  }
  const defaultAddress = Array.isArray(user?.addresses)
    ? user.addresses.find((a) => a?.isDefault)
    : null;

  const resolvedFullName =
    String(fullName || "").trim() ||
    String(defaultAddress?.fullName || "").trim() ||
    String(user?.fullName || "").trim();

  const resolvedPhoneNumber =
    String(phoneNumber || "").trim() ||
    String(defaultAddress?.phoneNumber || "").trim() ||
    String(user?.phone || "").trim();

  const resolvedShippingAddress =
    String(shippingAddress || "").trim() ||
    String(defaultAddress?.addressLine || "").trim() ||
    [user?.address, user?.provinceCity].filter(Boolean).join(", ").trim();

  if (
    !resolvedFullName ||
    !resolvedPhoneNumber ||
    !resolvedShippingAddress ||
    !paymentMethod
  ) {
    throw createHttpError(400, "Thiếu thông tin giao hàng/thanh toán");
  }

  const orderItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const productId = item?.product;
    const quantity = Number(item?.quantity || 0);
    if (!productId || quantity <= 0) continue;

    const product = await Product.findById(productId);
    if (!product) {
      throw createHttpError(404, `Không tìm thấy sản phẩm: ${productId}`);
    }

    if (product.stockQuantity < quantity) {
      throw createHttpError(400, `Sản phẩm không đủ tồn kho: ${product.name}`);
    }

    orderItems.push({
      product: product._id,
      productName: product.name,
      quantity,
      price: product.price,
    });

    totalAmount += product.price * quantity;
  }

  if (orderItems.length === 0) {
    throw createHttpError(400, "Items không hợp lệ");
  }

  const ship = Number(shippingFee || 0);

  let appliedVoucherCode = null;
  let discountAmount = 0;
  let claimed = false;

  if (voucherCode) {
    const code = String(voucherCode).trim();
    const { payload: validatePayload } = await voucherService.validateVoucher({
      code,
      orderValue: totalAmount,
    });

    if (!validatePayload?.valid) {
      throw createHttpError(
        400,
        validatePayload?.message || "Voucher không hợp lệ",
      );
    }

    await voucherService.claimVoucherUsage(code);
    claimed = true;
    appliedVoucherCode = code;
    discountAmount = Number(validatePayload?.discountAmount || 0);
    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      discountAmount = 0;
    }
  }

  const finalAmount = Math.max(0, totalAmount + ship - discountAmount);

  let order;
  try {
    order = await Order.create({
      user: user._id,
      fullName: resolvedFullName,
      phoneNumber: resolvedPhoneNumber,
      shippingAddress: resolvedShippingAddress,
      paymentMethod,
      note,
      shippingFee: ship,
      totalAmount,
      discountAmount,
      voucherCode: appliedVoucherCode,
      finalAmount,
      items: orderItems,
    });
  } catch (err) {
    if (claimed) {
      await voucherService.rollbackVoucherUsage(appliedVoucherCode);
    }
    throw err;
  }

  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stockQuantity: -item.quantity },
    });
  }

  return order;
}

async function getMyOrders(userId) {
  return Order.find({ user: userId }).sort({ createdAt: -1 });
}

async function getOrderById({ id, user } = {}) {
  const order = await Order.findById(id);
  if (!order) throw createHttpError(404, "Không tìm thấy đơn hàng");

  const isOwner = String(order.user) === String(user._id);
  const isStaff = ["ADMIN", "STAFF", "DELIVERY"].includes(user.role);

  if (!isOwner && !isStaff) {
    throw createHttpError(403, "Không có quyền truy cập");
  }

  return order;
}

async function getAllOrders() {
  return Order.find({}).sort({ createdAt: -1 });
}

async function updateOrderStatus(id, { orderStatus, paymentStatus } = {}) {
  const order = await Order.findById(id);
  if (!order) throw createHttpError(404, "Không tìm thấy đơn hàng");

  if (orderStatus !== undefined) order.orderStatus = orderStatus;
  if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;

  return order.save();
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
