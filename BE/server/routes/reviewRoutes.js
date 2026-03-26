const express = require("express");
const router = express.Router();

const {
  createReview,
  getReviewsForProduct,
  getPendingReviews,
  moderateReview,
  getMyReviewsForOrder,
  updateMyReview,
  deleteMyReview,
} = require("../controllers/reviewController");

const {
  protect,
  authorize,
  optionalProtect,
} = require("../middleware/authMiddleware");

router.get("/product/:productIdOrSlug", optionalProtect, getReviewsForProduct);
router.post("/", protect, createReview);
router.get("/my/order/:orderId", protect, getMyReviewsForOrder);
router.put("/:id", protect, updateMyReview);
router.delete("/:id", protect, deleteMyReview);

router.get("/pending", protect, authorize("ADMIN", "STAFF"), getPendingReviews);
router.put(
  "/:id/moderate",
  protect,
  authorize("ADMIN", "STAFF"),
  moderateReview,
);

module.exports = router;
