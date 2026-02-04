const express = require("express");
const router = express.Router();

const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplierController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("ADMIN", "STAFF"), getSuppliers);
router.get("/:id", protect, authorize("ADMIN", "STAFF"), getSupplierById);
router.post("/", protect, authorize("ADMIN", "STAFF"), createSupplier);
router.put("/:id", protect, authorize("ADMIN", "STAFF"), updateSupplier);
router.delete("/:id", protect, authorize("ADMIN", "STAFF"), deleteSupplier);

module.exports = router;
