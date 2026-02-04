const Voucher = require("../models/Voucher");
const { createHttpError } = require("../utils/httpError");

function nowInRange(voucher) {
  const now = new Date();
  if (voucher.startDate && now < voucher.startDate) return false;
  if (voucher.endDate && now > voucher.endDate) return false;
  return true;
}

async function getVouchers({ active } = {}) {
  const onlyActive = String(active || "").toLowerCase() === "true";
  const filter = onlyActive ? { status: "ACTIVE" } : {};
  return Voucher.find(filter).sort({ createdAt: -1 });
}

async function getVoucherByCode(code) {
  const voucher = await Voucher.findOne({ code: String(code).trim() });
  if (!voucher) throw createHttpError(404, "Không tìm thấy voucher");
  return voucher;
}

async function createVoucher(payload) {
  return Voucher.create(payload);
}

async function updateVoucher(id, payload) {
  const updated = await Voucher.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw createHttpError(404, "Không tìm thấy voucher");
  return updated;
}

async function deleteVoucher(id) {
  const deleted = await Voucher.findByIdAndDelete(id);
  if (!deleted) throw createHttpError(404, "Không tìm thấy voucher");
  return { message: "Đã xóa voucher" };
}

async function validateVoucher({ code, orderValue } = {}) {
  const trimmedCode = String(code || "").trim();
  const value = Number(orderValue || 0);

  if (!trimmedCode) {
    return {
      httpStatus: 400,
      payload: { valid: false, message: "Thiếu code" },
    };
  }

  const voucher = await Voucher.findOne({ code: trimmedCode });
  if (!voucher) {
    return {
      httpStatus: 404,
      payload: { valid: false, message: "Voucher không tồn tại" },
    };
  }

  if (voucher.status !== "ACTIVE") {
    return {
      httpStatus: 200,
      payload: { valid: false, message: "Voucher không hoạt động" },
    };
  }

  if (!nowInRange(voucher)) {
    return {
      httpStatus: 200,
      payload: {
        valid: false,
        message: "Voucher hết hạn hoặc chưa đến thời gian áp dụng",
      },
    };
  }

  if (voucher.usageLimit !== undefined && voucher.usageLimit !== null) {
    if (voucher.usedCount >= voucher.usageLimit) {
      return {
        httpStatus: 200,
        payload: { valid: false, message: "Voucher đã hết lượt sử dụng" },
      };
    }
  }

  if (value < (voucher.minOrderValue || 0)) {
    return {
      httpStatus: 200,
      payload: { valid: false, message: "Đơn hàng chưa đủ điều kiện áp dụng" },
    };
  }

  let discountAmount = 0;
  if (voucher.discountType === "PERCENT") {
    discountAmount = (value * voucher.discountValue) / 100;
  } else {
    discountAmount = voucher.discountValue;
  }

  if (
    voucher.maxDiscountAmount !== undefined &&
    voucher.maxDiscountAmount !== null
  ) {
    discountAmount = Math.min(discountAmount, voucher.maxDiscountAmount);
  }

  discountAmount = Math.max(0, Math.floor(discountAmount));

  return {
    httpStatus: 200,
    payload: { valid: true, discountAmount, voucher },
  };
}

async function claimVoucherUsage(code) {
  const trimmedCode = String(code || "").trim();
  if (!trimmedCode) throw createHttpError(400, "Thiếu code");

  const now = new Date();

  const updated = await Voucher.findOneAndUpdate(
    {
      code: trimmedCode,
      status: "ACTIVE",
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
      $or: [
        { usageLimit: null },
        { usageLimit: { $exists: false } },
        { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
      ],
    },
    { $inc: { usedCount: 1 } },
    { new: true },
  );

  if (!updated) {
    throw createHttpError(400, "Voucher đã hết lượt sử dụng hoặc không hợp lệ");
  }

  return updated;
}

async function rollbackVoucherUsage(code) {
  const trimmedCode = String(code || "").trim();
  if (!trimmedCode) return;
  await Voucher.findOneAndUpdate(
    { code: trimmedCode, usedCount: { $gt: 0 } },
    { $inc: { usedCount: -1 } },
  );
}

module.exports = {
  getVouchers,
  getVoucherByCode,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  validateVoucher,
  claimVoucherUsage,
  rollbackVoucherUsage,
};
