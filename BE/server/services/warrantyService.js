const WarrantyClaim = require("../models/WarrantyClaim");
const { createHttpError } = require("../utils/httpError");

async function createClaim(userId, payload = {}) {
  const { orderItemId, productSerialNumber, reason, imageProof } = payload;
  if (!orderItemId || !reason) {
    throw createHttpError(400, "Thiếu orderItemId hoặc reason");
  }

  return WarrantyClaim.create({
    user: userId,
    orderItemId,
    productSerialNumber,
    reason,
    imageProof: Array.isArray(imageProof) ? imageProof : [],
  });
}

async function getMyClaims(userId) {
  return WarrantyClaim.find({ user: userId }).sort({ createdAt: -1 });
}

async function getAllClaims() {
  return WarrantyClaim.find({})
    .populate("user", "fullName email")
    .sort({ createdAt: -1 });
}

async function updateClaim(id, { status, resolution, staffNote } = {}) {
  const claim = await WarrantyClaim.findById(id);
  if (!claim) throw createHttpError(404, "Không tìm thấy yêu cầu");

  if (status !== undefined) claim.status = status;
  if (resolution !== undefined) claim.resolution = resolution;
  if (staffNote !== undefined) claim.staffNote = staffNote;

  return claim.save();
}

module.exports = {
  createClaim,
  getMyClaims,
  getAllClaims,
  updateClaim,
};
