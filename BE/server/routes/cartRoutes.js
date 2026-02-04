const express = require("express");
const router = express.Router();

const {
  getMyCart,
  replaceMyCart,
  upsertMyCartItem,
  removeMyCartItem,
  clearMyCart,
} = require("../controllers/cartController");

const { protect } = require("../middleware/authMiddleware");

router.get("/me", protect, getMyCart);
router.put("/me", protect, replaceMyCart);
router.post("/me/items", protect, upsertMyCartItem);
router.delete("/me/items/:productId", protect, removeMyCartItem);
router.delete("/me", protect, clearMyCart);

module.exports = router;
