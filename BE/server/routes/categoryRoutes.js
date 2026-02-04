const express = require("express");
const router = express.Router();

const {
  getCategories,
  getCategoryByIdOrSlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getCategories);
router.get("/:idOrSlug", getCategoryByIdOrSlug);

router.post("/", protect, authorize("ADMIN", "STAFF"), createCategory);
router.put("/:id", protect, authorize("ADMIN", "STAFF"), updateCategory);
router.delete("/:id", protect, authorize("ADMIN", "STAFF"), deleteCategory);

module.exports = router;
