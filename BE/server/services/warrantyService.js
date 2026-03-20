const WarrantyClaim = require("../models/WarrantyClaim");
const Order = require("../models/Order");
const { createHttpError } = require("../utils/httpError");

async function createClaim(userId, payload = {}) {
  const {
    orderId,
    orderItemId,
    productSerialNumber,
    reason,
    description,
    imageProof,
  } = payload;

  if (!orderId || !orderItemId || !reason) {
    throw createHttpError(400, "Thiếu orderId, orderItemId hoặc reason");
  }

  // Verify order exists and belongs to user
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw createHttpError(404, "Đơn hàng không tồn tại");
  }

  // Check if claim already exists for this item (prevent duplicates)
  const existing = await WarrantyClaim.findOne({
    user: userId,
    orderItemId,
    status: { $in: ["PENDING", "RECEIVED_PRODUCT", "PROCESSING"] },
  });
  if (existing) {
    throw createHttpError(
      400,
      "Yêu cầu bảo hành cho sản phẩm này đang được xử lý",
    );
  }

  return WarrantyClaim.create({
    user: userId,
    order: orderId,
    orderItemId,
    productSerialNumber,
    reason,
    description,
    imageProof: Array.isArray(imageProof) ? imageProof : [],
  });
}

async function getMyClaims(userId) {
  return WarrantyClaim.find({ user: userId })
    .populate("user", "fullName email phone address")
    .populate(
      "order",
      "orderNumber totalAmount createdAt items shippingAddress",
    )
    .sort({ createdAt: -1 });
}

async function getClaimsByOrder(orderId) {
  return WarrantyClaim.find({ order: orderId })
    .populate("user", "fullName email phone address")
    .populate(
      "order",
      "orderNumber totalAmount createdAt items shippingAddress",
    )
    .sort({ createdAt: -1 });
}

async function getAllClaims(filter = {}) {
  const query = WarrantyClaim.find(filter)
    .populate("user", "fullName email phone address")
    .populate(
      "order",
      "orderNumber totalAmount createdAt items shippingAddress",
    )
    .populate("assignedTo", "fullName email");

  return query.sort({ createdAt: -1 });
}

async function getClaimsStats() {
  const stats = await WarrantyClaim.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgDays: {
          $avg: {
            $divide: [
              { $subtract: [new Date(), "$createdAt"] },
              1000 * 60 * 60 * 24, // Convert to days
            ],
          },
        },
      },
    },
  ]);

  return stats;
}

async function updateClaim(
  id,
  { status, resolution, staffNote, assignedTo, estimatedCompletionDate } = {},
) {
  const claim = await WarrantyClaim.findById(id);
  if (!claim) throw createHttpError(404, "Không tìm thấy yêu cầu");

  if (status !== undefined) {
    if (
      ![
        "PENDING",
        "RECEIVED_PRODUCT",
        "PROCESSING",
        "COMPLETED",
        "REJECTED",
      ].includes(status)
    ) {
      throw createHttpError(400, "Trạng thái không hợp lệ");
    }
    claim.status = status;

    // Set completion time if marking as completed
    if (status === "COMPLETED" && !claim.completedAt) {
      claim.completedAt = new Date();
    }
  }

  if (resolution !== undefined) {
    if (![null, "REPAIR", "REPLACE", "REFUND"].includes(resolution)) {
      throw createHttpError(400, "Giải pháp không hợp lệ");
    }
    claim.resolution = resolution;
  }

  if (staffNote !== undefined) claim.staffNote = staffNote;
  if (assignedTo !== undefined) claim.assignedTo = assignedTo;
  if (estimatedCompletionDate !== undefined)
    claim.estimatedCompletionDate = estimatedCompletionDate;

  return claim.save();
}

async function rejectClaim(id, reason) {
  const claim = await WarrantyClaim.findById(id);
  if (!claim) throw createHttpError(404, "Không tìm thấy yêu cầu");

  claim.status = "REJECTED";
  claim.staffNote = reason || "";
  return claim.save();
}

async function approveClaim(id, resolution) {
  const claim = await WarrantyClaim.findById(id);
  if (!claim) throw createHttpError(404, "Không tìm thấy yêu cầu");

  if (!["REPAIR", "REPLACE", "REFUND"].includes(resolution)) {
    throw createHttpError(400, "Giải pháp không hợp lệ");
  }

  claim.resolution = resolution;
  claim.status = "RECEIVED_PRODUCT";
  return claim.save();
}

module.exports = {
  createClaim,
  getMyClaims,
  getClaimsByOrder,
  getAllClaims,
  getClaimsStats,
  updateClaim,
  rejectClaim,
  approveClaim,
};
