const mongoose = require("mongoose");

const Review = require("../models/Review");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { createHttpError } = require("../utils/httpError");

async function createReview(userId, payload = {}) {
  const { product, order, rating, comment, images } = payload;

  if (!product || !order) {
    throw createHttpError(400, "Thiếu product hoặc order");
  }
  if (!rating) {
    throw createHttpError(400, "Thiếu rating");
  }

  const orderDoc = await Order.findById(order);
  if (!orderDoc) throw createHttpError(404, "Không tìm thấy đơn hàng");

  if (String(orderDoc.user) !== String(userId)) {
    throw createHttpError(403, "Không có quyền đánh giá đơn hàng này");
  }

  if (orderDoc.orderStatus !== "COMPLETED") {
    throw createHttpError(400, "Chỉ được đánh giá khi đơn hàng COMPLETED");
  }

  const hasProduct = orderDoc.items.some(
    (i) => String(i.product) === String(product),
  );
  if (!hasProduct) {
    throw createHttpError(400, "Sản phẩm không nằm trong đơn hàng");
  }

  const productDoc = await Product.findById(product).select("_id");
  if (!productDoc) throw createHttpError(404, "Không tìm thấy sản phẩm");

  return Review.create({
    user: userId,
    product,
    order,
    rating,
    comment,
    images: Array.isArray(images) ? images : [],
  });
}

async function getReviewsForProduct(productIdOrSlug) {
  const value = String(productIdOrSlug ?? "").trim();

  const productFilter = mongoose.Types.ObjectId.isValid(value)
    ? { _id: value }
    : { slug: value };

  const product = await Product.findOne(productFilter).select("_id");
  if (!product) return [];

  return Review.find({ product: product._id, status: "APPROVED" })
    .populate("user", "fullName")
    .sort({ createdAt: -1 });
}

async function getPendingReviews() {
  return Review.find({ status: "PENDING" })
    .populate("user", "fullName email")
    .populate("product", "name slug")
    .sort({ createdAt: -1 });
}

async function moderateReview(id, { status, reply } = {}) {
  const review = await Review.findById(id);
  if (!review) throw createHttpError(404, "Không tìm thấy review");

  if (status !== undefined) review.status = status;
  if (reply !== undefined) review.reply = reply;

  return review.save();
}

module.exports = {
  createReview,
  getReviewsForProduct,
  getPendingReviews,
  moderateReview,
};
