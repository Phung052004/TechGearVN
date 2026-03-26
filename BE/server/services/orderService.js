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

async function getAllOrdersForUser(user) {
  if (!user) return getAllOrders();

  if (user.role === "DELIVERY") {
    return Order.find({
      orderStatus: "SHIPPING",
      $or: [{ deliveryAssignee: null }, { deliveryAssignee: user._id }],
    })
      .populate("deliveryAssignee", "fullName email role")
      .sort({ createdAt: -1 });
  }

  return Order.find({})
    .populate("deliveryAssignee", "fullName email role")
    .sort({ createdAt: -1 });
}

async function claimOrder(orderId, user) {
  if (!user || user.role !== "DELIVERY") {
    throw createHttpError(403, "Không có quyền truy cập");
  }

  const order = await Order.findById(orderId);
  if (!order) throw createHttpError(404, "Không tìm thấy đơn hàng");

  if (order.orderStatus !== "SHIPPING") {
    throw createHttpError(400, "Đơn chưa sẵn sàng để giao");
  }

  if (order.deliveryAssignee) {
    if (String(order.deliveryAssignee) !== String(user._id)) {
      throw createHttpError(409, "Đơn đã có người nhận giao");
    }
    return order;
  }

  order.deliveryAssignee = user._id;
  order.deliveryClaimedAt = new Date();
  return order.save();
}

async function updateOrderStatus(id, payload = {}) {
  const { orderStatus, paymentStatus, deliveryAssignee } = payload;
  const order = await Order.findById(id);
  if (!order) throw createHttpError(404, "Không tìm thấy đơn hàng");

  const isTerminalState = ["COMPLETED", "CANCELLED"].includes(
    order.orderStatus,
  );

  if (isTerminalState) {
    if (orderStatus !== undefined && orderStatus !== order.orderStatus) {
      throw createHttpError(
        400,
        `Đơn hàng đã ở trạng thái ${order.orderStatus}, không thể chuyển sang trạng thái khác`,
      );
    }

    if (paymentStatus !== undefined && paymentStatus !== order.paymentStatus) {
      throw createHttpError(
        400,
        `Đơn hàng đã ở trạng thái ${order.orderStatus}, không thể thay đổi trạng thái thanh toán`,
      );
    }
  }

  const isCompletedAndPaid =
    order.orderStatus === "COMPLETED" && order.paymentStatus === "PAID";

  if (["RETURNED", "CANCELLED"].includes(orderStatus) && isCompletedAndPaid) {
    throw createHttpError(
      400,
      "Đơn hàng đã hoàn thành và thanh toán, không thể chuyển sang hoàn trả hoặc hủy",
    );
  }

  if (
    isCompletedAndPaid &&
    paymentStatus !== undefined &&
    paymentStatus !== "PAID"
  ) {
    throw createHttpError(
      400,
      "Đơn hàng đã hoàn thành và thanh toán, không thể thay đổi trạng thái thanh toán",
    );
  }

  const prevStatus = order.orderStatus;

  if (orderStatus !== undefined) order.orderStatus = orderStatus;
  if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;

  if (orderStatus === "COMPLETED") {
    order.paymentStatus = "PAID";
  }

  // Handle delivery assignment
  if (deliveryAssignee !== undefined) {
    if (deliveryAssignee && typeof deliveryAssignee === "string") {
      // Validate delivery person exists when assigning
      const User = require("../models/User");
      const deliveryPerson = await User.findById(deliveryAssignee);
      if (!deliveryPerson || deliveryPerson.role !== "DELIVERY") {
        throw createHttpError(400, "Người giao hàng không hợp lệ");
      }
      order.deliveryAssignee = deliveryAssignee;
      // Note: Don't set deliveryClaimedAt here - delivery person will set it when they claim
    } else if (!deliveryAssignee) {
      order.deliveryAssignee = null;
    }
  }

  // When moving into SHIPPING, clear any previous delivery assignment.
  // When moving out of SHIPPING, also clear assignment-related fields.
  if (orderStatus !== undefined && orderStatus !== prevStatus) {
    if (orderStatus === "SHIPPING") {
      if (!deliveryAssignee) {
        order.deliveryAssignee = null;
      }
      order.deliveryClaimedAt = undefined;
      order.deliveredAt = undefined;
    } else if (prevStatus === "SHIPPING") {
      order.deliveryAssignee = null;
      order.deliveryClaimedAt = undefined;
      order.deliveredAt = undefined;
    }
  }

  if (orderStatus === "COMPLETED" && !order.deliveredAt) {
    order.deliveredAt = new Date();
  }

  return order.save();
}

async function updateOrderStatusForUser(id, payload = {}, user) {
  if (!user) throw createHttpError(401, "Chưa đăng nhập");

  if (user.role === "DELIVERY") {
    const { orderStatus, failureReason } = payload || {};
    if (
      payload &&
      Object.prototype.hasOwnProperty.call(payload, "paymentStatus")
    ) {
      throw createHttpError(403, "Không có quyền cập nhật thanh toán");
    }
    if (
      orderStatus &&
      !["SHIPPING", "COMPLETED", "DELIVERY_FAILED"].includes(orderStatus)
    ) {
      throw createHttpError(400, "Trạng thái không hợp lệ cho giao hàng");
    }

    const order = await Order.findById(id);
    if (!order) throw createHttpError(404, "Không tìm thấy đơn hàng");

    if (["COMPLETED", "CANCELLED"].includes(order.orderStatus)) {
      throw createHttpError(
        400,
        `Đơn hàng đã ở trạng thái ${order.orderStatus}, không thể cập nhật`,
      );
    }

    if (
      !order.deliveryAssignee ||
      String(order.deliveryAssignee) !== String(user._id)
    ) {
      throw createHttpError(403, "Bạn chưa nhận đơn này");
    }

    if (orderStatus !== undefined) order.orderStatus = orderStatus;

    if (orderStatus === "COMPLETED") {
      order.paymentStatus = "PAID";
    }

    if (orderStatus === "COMPLETED" && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    // Handle delivery failure
    if (orderStatus === "DELIVERY_FAILED") {
      // Keep deliveryAssignee to track failures for this delivery person
      // This allows us to count their failed deliveries for metrics
      order.deliveryClaimedAt = null;
      // Keep the failure reason if provided
      if (failureReason) {
        order.note =
          (order.note || "") + `\n[Giao hàng thất bại] ${failureReason}`;
      }
    }

    return order.save();
  }

  return updateOrderStatus(id, payload);
}

const getDeliveryPeople = async () => {
  const Order = require("../models/Order");
  const User = require("../models/User");

  // Get all delivery persons
  const deliveryPersons = await User.find({ role: "DELIVERY" }).select(
    "_id fullName email phone avatarUrl",
  );

  // Calculate metrics for each delivery person
  const peopleWithMetrics = await Promise.all(
    deliveryPersons.map(async (person) => {
      // Completed deliveries
      const completed = await Order.countDocuments({
        deliveryAssignee: person._id,
        orderStatus: "COMPLETED",
      });

      // Failed deliveries
      const failed = await Order.countDocuments({
        deliveryAssignee: person._id,
        orderStatus: "DELIVERY_FAILED",
      });

      // Only count finished deliveries (completed + failed) for success rate
      const finishedCount = completed + failed;

      // Success rate based only on finished deliveries
      const successRate =
        finishedCount > 0 ? Math.round((completed / finishedCount) * 100) : 0;

      return {
        _id: person._id,
        fullName: person.fullName,
        email: person.email,
        phone: person.phone,
        avatarUrl: person.avatarUrl,
        completedCount: completed,
        failureCount: failed,
        assignedCount: finishedCount, // Only finished deliveries
        successRate: successRate,
      };
    }),
  );

  // Sort by success rate (highest first) then by completed count
  return peopleWithMetrics.sort(
    (a, b) =>
      b.successRate - a.successRate || b.completedCount - a.completedCount,
  );
};

const getDeliveryMetrics = async () => {
  const Order = require("../models/Order");
  const User = require("../models/User");

  // Get delivery people metrics
  const byPerson = await getDeliveryPeople();

  // Calculate total metrics - only from finished deliveries
  const totalCompleted = await Order.countDocuments({
    orderStatus: "COMPLETED",
  });
  const totalFailed = await Order.countDocuments({
    orderStatus: "DELIVERY_FAILED",
  });
  const totalFinished = totalCompleted + totalFailed;
  const totalDeliveryPersons = await User.countDocuments({ role: "DELIVERY" });

  const overallSuccessRate =
    totalFinished > 0 ? Math.round((totalCompleted / totalFinished) * 100) : 0;

  // Get failure reasons
  const failuredOrders = await Order.find({
    orderStatus: "DELIVERY_FAILED",
  }).select("note");
  const failureReasons = {}; // Count by reason
  failuredOrders.forEach((order) => {
    const reason = order.note || "Unknown reason";
    failureReasons[reason] = (failureReasons[reason] || 0) + 1;
  });

  return {
    totals: {
      deliveryPersonCount: totalDeliveryPersons,
      totalAssigned: totalFinished,
      totalCompleted,
      totalFailed,
      overallSuccessRate,
    },
    failureReasons,
    byPerson,
  };
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  getAllOrdersForUser,
  updateOrderStatus,
  updateOrderStatusForUser,
  claimOrder,
  getDeliveryPeople,
  getDeliveryMetrics,
};
