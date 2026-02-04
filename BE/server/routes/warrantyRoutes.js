const express = require("express");
const router = express.Router();

const {
  createClaim,
  getMyClaims,
  getAllClaims,
  updateClaim,
} = require("../controllers/warrantyController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/me", protect, getMyClaims);
router.post("/", protect, createClaim);

router.get("/", protect, authorize("ADMIN", "STAFF"), getAllClaims);
router.put("/:id", protect, authorize("ADMIN", "STAFF"), updateClaim);

module.exports = router;
