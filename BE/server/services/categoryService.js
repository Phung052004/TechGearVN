const mongoose = require("mongoose");

const Category = require("../models/Category");
const slugify = require("../utils/slugify");
const { createHttpError } = require("../utils/httpError");

async function getCategories({ parentId } = {}) {
  const filter = {};
  if (parentId) filter.parent = parentId;

  return Category.find(filter).sort({ name: 1 });
}

async function getCategoryByIdOrSlug(idOrSlug) {
  const value = String(idOrSlug ?? "").trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(value);

  const category = isObjectId
    ? await Category.findById(value)
    : await Category.findOne({ slug: value });

  if (!category) throw createHttpError(404, "Không tìm thấy danh mục");
  return category;
}

async function createCategory({ name, slug, parent } = {}) {
  if (!name) throw createHttpError(400, "Thiếu name");

  return Category.create({
    name,
    slug: slug ? String(slug).trim() : slugify(name),
    parent: parent || null,
  });
}

async function updateCategory(id, { name, slug, parent } = {}) {
  const category = await Category.findById(id);
  if (!category) throw createHttpError(404, "Không tìm thấy danh mục");

  if (name !== undefined) category.name = name;
  if (slug !== undefined) category.slug = String(slug).trim();
  if (parent !== undefined) category.parent = parent || null;

  return category.save();
}

async function deleteCategory(id) {
  const deleted = await Category.findByIdAndDelete(id);
  if (!deleted) throw createHttpError(404, "Không tìm thấy danh mục");
  return { message: "Đã xóa danh mục" };
}

module.exports = {
  getCategories,
  getCategoryByIdOrSlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
