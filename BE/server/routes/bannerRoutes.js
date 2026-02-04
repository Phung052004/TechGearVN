const express = require("express");
const router = express.Router();

const {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../controllers/bannerController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getBanners);
router.post("/", protect, authorize("ADMIN", "STAFF"), createBanner);
router.put("/:id", protect, authorize("ADMIN", "STAFF"), updateBanner);
router.delete("/:id", protect, authorize("ADMIN", "STAFF"), deleteBanner);

module.exports = router;
