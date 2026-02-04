const express = require("express");
const router = express.Router();

const {
  getReceipts,
  getReceiptById,
  createReceipt,
} = require("../controllers/importReceiptController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("ADMIN", "STAFF"), getReceipts);
router.get("/:id", protect, authorize("ADMIN", "STAFF"), getReceiptById);
router.post("/", protect, authorize("ADMIN", "STAFF"), createReceipt);

module.exports = router;
