const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const { getAnalyticsOverview } = require("../controllers/adminController");

router.get(
  "/analytics/overview",
  protect,
  authorize("ADMIN"),
  getAnalyticsOverview,
);

module.exports = router;
