const Banner = require("../models/Banner");
const { createHttpError } = require("../utils/httpError");

async function getBanners({ all } = {}) {
  const showAll = String(all || "").toLowerCase() === "true";
  const filter = showAll ? {} : { isActive: true };

  return Banner.find(filter).sort({
    position: 1,
    displayOrder: 1,
    createdAt: -1,
  });
}

async function createBanner(payload) {
  return Banner.create(payload);
}

async function updateBanner(id, payload) {
  const updated = await Banner.findByIdAndUpdate(id, payload, { new: true });
  if (!updated) throw createHttpError(404, "Không tìm thấy banner");
  return updated;
}

async function deleteBanner(id) {
  const deleted = await Banner.findByIdAndDelete(id);
  if (!deleted) throw createHttpError(404, "Không tìm thấy banner");
  return { message: "Đã xóa banner" };
}

module.exports = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
