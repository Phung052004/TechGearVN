const mongoose = require("mongoose");

const Article = require("../models/Article");
const slugify = require("../utils/slugify");
const { createHttpError } = require("../utils/httpError");

const AUTHOR_POPULATE = "fullName email role";

async function getArticles({ type, all } = {}) {
  const showAll = String(all || "").toLowerCase() === "true";

  const filter = {};
  if (!showAll) filter.isActive = true;
  if (type) filter.type = type;

  return Article.find(filter)
    .populate("author", AUTHOR_POPULATE)
    .sort({ createdAt: -1 });
}

async function getArticleByIdOrSlug({ idOrSlug, userRole } = {}) {
  const value = String(idOrSlug ?? "").trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(value);

  const article = isObjectId
    ? await Article.findById(value).populate("author", AUTHOR_POPULATE)
    : await Article.findOne({ slug: value }).populate(
        "author",
        AUTHOR_POPULATE,
      );

  if (!article) throw createHttpError(404, "Không tìm thấy bài viết");

  const role = String(userRole || "").toUpperCase();
  if (!article.isActive && !["ADMIN", "STAFF"].includes(role)) {
    throw createHttpError(404, "Không tìm thấy bài viết");
  }

  return article;
}

async function createArticle({ payload, authorId } = {}) {
  const body = { ...(payload || {}) };

  if (!body.title) throw createHttpError(400, "Thiếu title");
  if (!body.content) throw createHttpError(400, "Thiếu content");

  if (!body.slug) body.slug = slugify(body.title);
  body.author = authorId;

  return Article.create(body);
}

async function updateArticle(id, payload) {
  const updated = await Article.findByIdAndUpdate(id, payload, { new: true });
  if (!updated) throw createHttpError(404, "Không tìm thấy bài viết");
  return updated;
}

async function deleteArticle(id) {
  const deleted = await Article.findByIdAndDelete(id);
  if (!deleted) throw createHttpError(404, "Không tìm thấy bài viết");
  return { message: "Đã xóa bài viết" };
}

module.exports = {
  getArticles,
  getArticleByIdOrSlug,
  createArticle,
  updateArticle,
  deleteArticle,
};
