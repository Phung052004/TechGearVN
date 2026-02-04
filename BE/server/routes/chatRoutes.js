const express = require("express");
const router = express.Router();

const {
  getOrCreateMyRoom,
  listRooms,
  closeRoom,
  getMessages,
  sendMessage,
} = require("../controllers/chatController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/rooms/me", protect, getOrCreateMyRoom);

router.get("/rooms", protect, authorize("ADMIN", "STAFF"), listRooms);
router.put(
  "/rooms/:roomId/close",
  protect,
  authorize("ADMIN", "STAFF"),
  closeRoom,
);

router.get("/rooms/:roomId/messages", protect, getMessages);
router.post("/rooms/:roomId/messages", protect, sendMessage);

module.exports = router;
