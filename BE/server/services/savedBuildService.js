const crypto = require("crypto");

const SavedPcBuild = require("../models/SavedPcBuild");
const Product = require("../models/Product");
const { createHttpError } = require("../utils/httpError");

async function computeTotal(items) {
  let total = 0;
  for (const item of items) {
    const p = await Product.findById(item.product);
    if (!p) continue;
    item.productName = p.name;
    item.price = p.price;
    total += p.price;
  }
  return total;
}

async function getMyBuilds(userId) {
  return SavedPcBuild.find({ user: userId }).sort({ createdAt: -1 });
}

async function createBuild(userId, payload = {}) {
  const { name, items, share } = payload;
  if (!name) throw createHttpError(400, "Thiếu name");

  const buildItems = Array.isArray(items)
    ? items.filter((i) => i && i.product).map((i) => ({ product: i.product }))
    : [];

  const totalPrice = await computeTotal(buildItems);
  const shareLink = share ? crypto.randomBytes(8).toString("hex") : undefined;

  return SavedPcBuild.create({
    user: userId,
    name,
    items: buildItems,
    totalPrice,
    shareLink,
  });
}

async function getBuildByIdOrShare(userId, idOrShare) {
  const build = await SavedPcBuild.findOne({
    $or: [{ _id: idOrShare }, { shareLink: idOrShare }],
  });

  if (!build) throw createHttpError(404, "Không tìm thấy cấu hình");

  const isOwner = String(build.user) === String(userId);
  const isShared = String(build.shareLink) === String(idOrShare);

  if (!isOwner && !isShared) {
    throw createHttpError(403, "Không có quyền truy cập");
  }

  return build;
}

async function updateBuild(userId, id, payload = {}) {
  const build = await SavedPcBuild.findById(id);
  if (!build) throw createHttpError(404, "Không tìm thấy cấu hình");

  if (String(build.user) !== String(userId)) {
    throw createHttpError(403, "Không có quyền truy cập");
  }

  if (payload.name !== undefined) build.name = payload.name;

  if (payload.items !== undefined) {
    const buildItems = Array.isArray(payload.items)
      ? payload.items
          .filter((i) => i && i.product)
          .map((i) => ({ product: i.product }))
      : [];

    build.items = buildItems;
    build.totalPrice = await computeTotal(build.items);
  }

  return build.save();
}

async function deleteBuild(userId, id) {
  const build = await SavedPcBuild.findById(id);
  if (!build) throw createHttpError(404, "Không tìm thấy cấu hình");

  if (String(build.user) !== String(userId)) {
    throw createHttpError(403, "Không có quyền truy cập");
  }

  await SavedPcBuild.findByIdAndDelete(id);
  return { message: "Đã xóa cấu hình" };
}

module.exports = {
  getMyBuilds,
  createBuild,
  getBuildByIdOrShare,
  updateBuild,
  deleteBuild,
};
