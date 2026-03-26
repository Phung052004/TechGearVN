const crypto = require("crypto");

const SavedPcBuild = require("../models/SavedPcBuild");
const Product = require("../models/Product");
const { createHttpError } = require("../utils/httpError");

const BUILD_ITEM_POPULATE = {
  path: "items.product",
  select:
    "name slug price thumbnail image subCategory stockQuantity countInStock status",
};

async function computeTotal(items) {
  let total = 0;
  for (const item of items) {
    const p = await Product.findById(item.product);
    if (!p) continue;
    item.productName = p.name;
    item.price = p.price;
    item.category = p.subCategory;
    total += p.price;
  }
  return total;
}

function normalizeBuildName(name) {
  const next = String(name || "").trim();
  if (!next) throw createHttpError(400, "Tên cấu hình không hợp lệ");
  return next;
}

function normalizeBuildItems(items) {
  const buildItems = Array.isArray(items)
    ? items.filter((item) => item && item.product)
    : [];

  if (buildItems.length === 0) {
    throw createHttpError(400, "Cấu hình phải có ít nhất 1 linh kiện");
  }

  return buildItems.map((item) => ({ product: item.product }));
}

async function getBuildByIdWithAccess(userId, id) {
  const build = await SavedPcBuild.findById(id);
  if (!build) throw createHttpError(404, "Không tìm thấy cấu hình");

  if (String(build.user) !== String(userId)) {
    throw createHttpError(403, "Không có quyền truy cập");
  }

  return build;
}

async function getMyBuilds(userId) {
  return SavedPcBuild.find({ user: userId })
    .populate(BUILD_ITEM_POPULATE)
    .sort({ createdAt: -1 });
}

async function createBuild(userId, payload = {}) {
  const { name, items, share } = payload;
  const normalizedName = normalizeBuildName(name);
  const buildItems = normalizeBuildItems(items);

  const totalPrice = await computeTotal(buildItems);
  const shareLink = share ? crypto.randomBytes(8).toString("hex") : undefined;

  const created = await SavedPcBuild.create({
    user: userId,
    name: normalizedName,
    items: buildItems,
    totalPrice,
    shareLink,
  });

  return SavedPcBuild.findById(created._id).populate(BUILD_ITEM_POPULATE);
}

async function getBuildByIdOrShare(userId, idOrShare) {
  const build = await SavedPcBuild.findOne({
    $or: [{ _id: idOrShare }, { shareLink: idOrShare }],
  }).populate(BUILD_ITEM_POPULATE);

  if (!build) throw createHttpError(404, "Không tìm thấy cấu hình");

  const isOwner = String(build.user) === String(userId);
  const isShared = String(build.shareLink) === String(idOrShare);

  if (!isOwner && !isShared) {
    throw createHttpError(403, "Không có quyền truy cập");
  }

  return build;
}

async function getBuildByShareLink(shareLink) {
  const trimmed = String(shareLink || "").trim();
  if (!trimmed) throw createHttpError(400, "Share link không hợp lệ");

  const build = await SavedPcBuild.findOne({ shareLink: trimmed }).populate(
    BUILD_ITEM_POPULATE,
  );
  if (!build)
    throw createHttpError(404, "Không tìm thấy cấu hình được chia sẻ");

  return build;
}

async function updateBuild(userId, id, payload = {}) {
  const build = await getBuildByIdWithAccess(userId, id);

  if (payload.name !== undefined) {
    build.name = normalizeBuildName(payload.name);
  }

  if (payload.items !== undefined) {
    const buildItems = normalizeBuildItems(payload.items);

    build.items = buildItems;
    build.totalPrice = await computeTotal(build.items);
  }

  if (payload.share !== undefined) {
    const shouldShare = Boolean(payload.share);
    if (shouldShare && !build.shareLink) {
      build.shareLink = crypto.randomBytes(8).toString("hex");
    }
    if (!shouldShare) {
      build.shareLink = undefined;
    }
  }

  const saved = await build.save();
  return SavedPcBuild.findById(saved._id).populate(BUILD_ITEM_POPULATE);
}

async function deleteBuild(userId, id) {
  await getBuildByIdWithAccess(userId, id);

  await SavedPcBuild.findByIdAndDelete(id);
  return { message: "Đã xóa cấu hình" };
}

module.exports = {
  getMyBuilds,
  createBuild,
  getBuildByIdOrShare,
  getBuildByShareLink,
  updateBuild,
  deleteBuild,
};
