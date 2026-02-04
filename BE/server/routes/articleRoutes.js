const express = require("express");
const router = express.Router();

const {
  getArticles,
  getArticleByIdOrSlug,
  createArticle,
  updateArticle,
  deleteArticle,
} = require("../controllers/articleController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getArticles);

// reading by slug can be public, controller will hide inactive
router.get("/:idOrSlug", getArticleByIdOrSlug);

router.post("/", protect, authorize("ADMIN", "STAFF"), createArticle);
router.put("/:id", protect, authorize("ADMIN", "STAFF"), updateArticle);
router.delete("/:id", protect, authorize("ADMIN", "STAFF"), deleteArticle);

module.exports = router;
