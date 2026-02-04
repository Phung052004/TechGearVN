const express = require("express");
const router = express.Router();

const {
  getBrands,
  getBrandByIdOrSlug,
  createBrand,
  updateBrand,
  deleteBrand,
} = require("../controllers/brandController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getBrands);
router.get("/:idOrSlug", getBrandByIdOrSlug);

router.post("/", protect, authorize("ADMIN", "STAFF"), createBrand);
router.put("/:id", protect, authorize("ADMIN", "STAFF"), updateBrand);
router.delete("/:id", protect, authorize("ADMIN", "STAFF"), deleteBrand);

module.exports = router;
