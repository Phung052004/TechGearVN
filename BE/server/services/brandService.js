const mongoose = require("mongoose");

const Brand = require("../models/Brand");
const slugify = require("../utils/slugify");
const { createHttpError } = require("../utils/httpError");

async function getBrands() {
  return Brand.find({}).sort({ name: 1 });
}

async function getBrandByIdOrSlug(idOrSlug) {
  const value = String(idOrSlug ?? "").trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(value);

  const brand = isObjectId
    ? await Brand.findById(value)
    : await Brand.findOne({ slug: value });

  if (!brand) throw createHttpError(404, "Không tìm thấy hãng");
  return brand;
}

async function createBrand({ name, slug } = {}) {
  if (!name) throw createHttpError(400, "Thiếu name");

  return Brand.create({
    name,
    slug: slug ? String(slug).trim() : slugify(name),
  });
}

async function updateBrand(id, { name, slug } = {}) {
  const brand = await Brand.findById(id);
  if (!brand) throw createHttpError(404, "Không tìm thấy hãng");

  if (name !== undefined) brand.name = name;
  if (slug !== undefined) brand.slug = String(slug).trim();

  return brand.save();
}

async function deleteBrand(id) {
  const deleted = await Brand.findByIdAndDelete(id);
  if (!deleted) throw createHttpError(404, "Không tìm thấy hãng");
  return { message: "Đã xóa hãng" };
}

module.exports = {
  getBrands,
  getBrandByIdOrSlug,
  createBrand,
  updateBrand,
  deleteBrand,
};
