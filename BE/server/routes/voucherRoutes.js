const express = require("express");
const router = express.Router();

const {
  getVouchers,
  getVoucherByCode,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  validateVoucher,
} = require("../controllers/voucherController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/validate", validateVoucher);
router.get("/", getVouchers);
router.get("/:code", getVoucherByCode);

router.post("/", protect, authorize("ADMIN", "STAFF"), createVoucher);
router.put("/:id", protect, authorize("ADMIN", "STAFF"), updateVoucher);
router.delete("/:id", protect, authorize("ADMIN", "STAFF"), deleteVoucher);

module.exports = router;
