const express = require("express");
const router = express.Router();

const {
  createReview,
  getReviewsForProduct,
  getPendingReviews,
  moderateReview,
} = require("../controllers/reviewController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/product/:productIdOrSlug", getReviewsForProduct);
router.post("/", protect, createReview);

router.get("/pending", protect, authorize("ADMIN", "STAFF"), getPendingReviews);
router.put(
  "/:id/moderate",
  protect,
  authorize("ADMIN", "STAFF"),
  moderateReview,
);

module.exports = router;
