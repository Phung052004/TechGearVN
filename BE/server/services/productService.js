const mongoose = require("mongoose");

const Product = require("../models/Product");
const Category = require("../models/Category");
const Brand = require("../models/Brand");
const ProductSpec = require("../models/ProductSpec");
const slugify = require("../utils/slugify");
const { createHttpError } = require("../utils/httpError");

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactI(value) {
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return new RegExp(`^${escapeRegex(trimmed)}$`, "i");
}

async function resolveCategoryId(value) {
  if (!value) return null;
  if (isObjectId(value)) return value;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  // Try exact slug match first (case-insensitive)
  const bySlug = await Category.findOne({
    slug: new RegExp(`^${escapeRegex(trimmed)}$`, "i"),
  }).select("_id");
  if (bySlug) return bySlug._id;

  // Try slug match with slugify normalization
  const normalizedSlug = slugify(trimmed, {
    lower: true,
    strict: true,
    trim: true,
  });
  const byNormalizedSlug = await Category.findOne({
    slug: normalizedSlug,
  }).select("_id");
  if (byNormalizedSlug) return byNormalizedSlug._id;

  // Try exact name match (case-insensitive)
  const byName = await Category.findOne({
    name: new RegExp(`^${escapeRegex(trimmed)}$`, "i"),
  }).select("_id");
  if (byName) return byName._id;

  return null;
}

async function resolveBrandId(value) {
  if (!value) return null;
  if (isObjectId(value)) return value;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  // Try exact slug match first (case-insensitive)
  const bySlug = await Brand.findOne({
    slug: new RegExp(`^${escapeRegex(trimmed)}$`, "i"),
  }).select("_id");
  if (bySlug) return bySlug._id;

  // Try slug match with slugify normalization
  const normalizedSlug = slugify(trimmed, {
    lower: true,
    strict: true,
    trim: true,
  });
  const byNormalizedSlug = await Brand.findOne({ slug: normalizedSlug }).select(
    "_id",
  );
  if (byNormalizedSlug) return byNormalizedSlug._id;

  // Try exact name match (case-insensitive)
  const byName = await Brand.findOne({
    name: new RegExp(`^${escapeRegex(trimmed)}$`, "i"),
  }).select("_id");
  if (byName) return byName._id;

  return null;
}

async function getProducts(query) {
  const filter = {};

  const includeInactive =
    String(query.includeInactive || "").toLowerCase() === "true";
  // Default: show everything except explicitly INACTIVE.
  // This keeps older data (missing/legacy status values) visible.
  if (!includeInactive) filter.status = { $ne: "INACTIVE" };

  if (query.q) {
    filter.name = { $regex: String(query.q).trim(), $options: "i" };
  }

  if (query.category) {
    const categoryId = await resolveCategoryId(query.category);
    if (categoryId) filter.category = categoryId;
    else return [];
  }

  if (query.brand) {
    const brandId = await resolveBrandId(query.brand);
    if (brandId) filter.brand = brandId;
    else return [];
  }

  // Legacy filter: match subCategory strings (used heavily by existing seed data)
  // Accept either a single value (?subCategory=CPU) or a comma-separated list
  // (?subCategories=CPU,VGA,RAM)
  const subCategoryValues = [];
  if (query.subCategory) {
    subCategoryValues.push(String(query.subCategory));
  }
  if (query.subCategories) {
    const parts = String(query.subCategories)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    subCategoryValues.push(...parts);
  }
  if (subCategoryValues.length > 0) {
    const regexes = subCategoryValues.map((v) => exactI(v)).filter(Boolean);
    if (regexes.length > 0) {
      filter.subCategory = { $in: regexes };
    }
  }

  if (query.specKey && query.specValue) {
    const specDocs = await ProductSpec.find({
      specKey: String(query.specKey).trim(),
      specValue: String(query.specValue).trim(),
    }).select("product");

    const productIds = specDocs.map((d) => d.product);
    filter._id = { $in: productIds };
  }

  const products = await Product.find(filter)
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .sort({ createdAt: -1 });

  return products;
}

async function getProductById(id) {
  const product = isObjectId(id)
    ? await Product.findById(id)
        .populate("category", "name slug")
        .populate("brand", "name slug")
    : await Product.findOne({ slug: id })
        .populate("category", "name slug")
        .populate("brand", "name slug");

  if (!product) throw createHttpError(404, "Không tìm thấy sản phẩm");
  return product;
}

async function createProduct(bodyInput) {
  const body = { ...bodyInput };

  if (!body.slug) {
    body.slug = slugify(body.name);
  }

  if (!body.thumbnail && body.image) {
    body.thumbnail = body.image;
  }

  if (body.originalPrice === undefined && body.oldPrice !== undefined) {
    body.originalPrice = body.oldPrice;
  }
  if (body.stockQuantity === undefined && body.countInStock !== undefined) {
    body.stockQuantity = body.countInStock;
  }

  if (
    body.originalPrice !== undefined &&
    body.originalPrice !== null &&
    body.price !== undefined &&
    body.price !== null
  ) {
    const originalPrice = Number(body.originalPrice);
    const price = Number(body.price);
    if (
      Number.isFinite(originalPrice) &&
      Number.isFinite(price) &&
      originalPrice > 0 &&
      price > originalPrice
    ) {
      throw createHttpError(400, "Giá sau giảm không được lớn hơn giá gốc");
    }
  }

  if (
    body.status &&
    (body.status === "Còn hàng" || body.status === "Hết hàng")
  ) {
    body.status = "ACTIVE";
  }

  const product = new Product(body);
  const createdProduct = await product.save();
  return createdProduct;
}

async function updateProduct(id, bodyInput) {
  if (!isObjectId(id)) throw createHttpError(400, "Product id không hợp lệ");

  const product = await Product.findById(id);
  if (!product) throw createHttpError(404, "Không tìm thấy sản phẩm");

  const body = bodyInput && typeof bodyInput === "object" ? bodyInput : {};

  const allowed = [
    "name",
    "price",
    "originalPrice",
    "thumbnail",
    "image",
    "description",
    "category",
    "brand",
    "status",
    "subCategory",
    "sku",
    "discount",
  ];

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      if (body[key] !== undefined) product[key] = body[key];
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    product.status = body.isActive ? "ACTIVE" : "INACTIVE";
  }

  if (!product.thumbnail && product.image) {
    product.thumbnail = product.image;
  }
  if (!product.image && product.thumbnail) {
    product.image = product.thumbnail;
  }

  if (
    product.status &&
    (product.status === "Còn hàng" || product.status === "Hết hàng")
  ) {
    product.status = "ACTIVE";
  }

  if (
    product.originalPrice !== undefined &&
    product.originalPrice !== null &&
    product.price !== undefined &&
    product.price !== null
  ) {
    const originalPrice = Number(product.originalPrice);
    const price = Number(product.price);
    if (
      Number.isFinite(originalPrice) &&
      Number.isFinite(price) &&
      originalPrice > 0 &&
      price > originalPrice
    ) {
      throw createHttpError(400, "Giá sau giảm không được lớn hơn giá gốc");
    }
  }

  const saved = await product.save();
  return saved;
}

async function getProductSpecs(id) {
  const product = isObjectId(id)
    ? await Product.findById(id).select("_id")
    : await Product.findOne({ slug: id }).select("_id");
  if (!product) throw createHttpError(404, "Không tìm thấy sản phẩm");

  const specs = await ProductSpec.find({ product: product._id }).sort({
    specKey: 1,
    specValue: 1,
  });
  return specs;
}

async function replaceProductSpecs(id, specsInput) {
  const product = isObjectId(id)
    ? await Product.findById(id).select("_id")
    : await Product.findOne({ slug: id }).select("_id");
  if (!product) throw createHttpError(404, "Không tìm thấy sản phẩm");

  const specs = Array.isArray(specsInput) ? specsInput : [];

  await ProductSpec.deleteMany({ product: product._id });
  if (specs.length > 0) {
    const docs = specs
      .filter((s) => s && s.specKey && s.specValue)
      .map((s) => ({
        product: product._id,
        specKey: String(s.specKey).trim(),
        specValue: String(s.specValue).trim(),
      }));
    if (docs.length > 0) await ProductSpec.insertMany(docs);
  }

  const saved = await ProductSpec.find({ product: product._id }).sort({
    specKey: 1,
    specValue: 1,
  });
  return saved;
}

// --- DELETE PRODUCT IMAGE ---
async function deleteProductImage(productId, imageUrl) {
  if (!isObjectId(productId)) {
    throw createHttpError(400, "Product ID không hợp lệ");
  }

  const product = await Product.findById(productId);
  if (!product) throw createHttpError(404, "Không tìm thấy sản phẩm");

  // Remove from images array
  product.images = (product.images || []).filter((img) => img !== imageUrl);
  await product.save();

  return product;
}

// --- UPDATE PRODUCT THUMBNAIL ---
async function updateProductThumbnail(productId, thumbnailUrl) {
  if (!isObjectId(productId)) {
    throw createHttpError(400, "Product ID không hợp lệ");
  }

  if (!thumbnailUrl) {
    throw createHttpError(400, "Thumbnail URL không được để trống");
  }

  const product = await Product.findById(productId);
  if (!product) throw createHttpError(404, "Không tìm thấy sản phẩm");

  product.thumbnail = thumbnailUrl;
  await product.save();

  return product;
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  getProductSpecs,
  replaceProductSpecs,
  deleteProductImage,
  updateProductThumbnail,
};
