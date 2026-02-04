const reviewService = require("../services/reviewService");

exports.createReview = async (req, res) => {
  try {
    const created = await reviewService.createReview(req.user._id, req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.getReviewsForProduct = async (req, res) => {
  try {
    const reviews = await reviewService.getReviewsForProduct(
      req.params.productIdOrSlug,
    );
    return res.json(reviews);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.getPendingReviews = async (req, res) => {
  try {
    const reviews = await reviewService.getPendingReviews();
    return res.json(reviews);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.moderateReview = async (req, res) => {
  try {
    const saved = await reviewService.moderateReview(req.params.id, req.body);
    return res.json(saved);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};
