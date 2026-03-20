const express = require("express");
const router = express.Router();

const {
  createClaim,
  getMyClaims,
  getClaimsByOrder,
  getAllClaims,
  getStats,
  updateClaim,
  rejectClaim,
  approveClaim,
} = require("../controllers/warrantyController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Customer routes (must come FIRST to avoid matching :id routes)
router.post("/", protect, createClaim);
router.get("/me", protect, getMyClaims);

// Staff/Admin stats route (must come before :id routes)
router.get("/stats", protect, authorize("ADMIN", "STAFF"), getStats);

// Order-specific route
router.get("/order/:orderId", protect, getClaimsByOrder);

// Staff/Admin routes with ID param (must come AFTER specific routes)
router.get("/", protect, authorize("ADMIN", "STAFF"), getAllClaims);
router.put("/:id", protect, authorize("ADMIN", "STAFF"), updateClaim);
router.post("/:id/reject", protect, authorize("ADMIN", "STAFF"), rejectClaim);
router.post("/:id/approve", protect, authorize("ADMIN", "STAFF"), approveClaim);

module.exports = router;
