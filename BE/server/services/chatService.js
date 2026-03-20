const ChatRoom = require("../models/ChatRoom");
const ChatMessage = require("../models/ChatMessage");
const { createHttpError } = require("../utils/httpError");

async function assertCanAccessRoom(roomId, user) {
  const room = await ChatRoom.findById(roomId);
  if (!room) throw createHttpError(404, "Không tìm thấy phòng chat");

  const isStaff = ["ADMIN", "STAFF"].includes(user.role);
  const isOwner = String(room.user) === String(user._id);

  if (!isOwner && !isStaff)
    throw createHttpError(403, "Không có quyền truy cập");

  return room;
}

async function getOrCreateMyRoom(userId) {
  let room = await ChatRoom.findOne({ user: userId, status: "OPEN" });
  if (!room) room = await ChatRoom.create({ user: userId });
  return room;
}

async function listRooms() {
  const rooms = await ChatRoom.find({})
    .populate("user", "fullName email")
    .sort({ updatedAt: -1 });

  const roomIds = rooms.map((r) => r._id);
  if (roomIds.length === 0) return [];

  const unreadAgg = await ChatMessage.aggregate([
    { $match: { room: { $in: roomIds }, isRead: false } },
    { $group: { _id: "$room", unreadCount: { $sum: 1 } } },
  ]);

  const unreadMap = new Map(
    unreadAgg.map((x) => [String(x._id), Number(x.unreadCount || 0)]),
  );

  return rooms.map((r) => {
    const json = r.toJSON ? r.toJSON() : r;
    return {
      ...json,
      unreadCount: unreadMap.get(String(r._id)) || 0,
    };
  });
}

async function closeRoom(roomId) {
  const room = await ChatRoom.findById(roomId);
  if (!room) throw createHttpError(404, "Không tìm thấy phòng chat");

  room.status = "CLOSED";
  return room.save();
}

async function getMessages(roomId, user) {
  const room = await assertCanAccessRoom(roomId, user);

  const messages = await ChatMessage.find({ room: room._id })
    .populate("sender", "fullName role")
    .sort({ createdAt: 1 });

  const isStaff = ["ADMIN", "STAFF"].includes(user.role);
  if (isStaff) {
    await ChatMessage.updateMany(
      { room: room._id, isRead: false },
      { $set: { isRead: true } },
    );
  }

  return { room, messages };
}

async function sendMessage(roomId, user, rawMessage) {
  const room = await assertCanAccessRoom(roomId, user);

  if (room.status !== "OPEN") {
    throw createHttpError(400, "Phòng chat đã đóng");
  }

  const message = String(rawMessage || "").trim();
  if (!message) throw createHttpError(400, "Thiếu message");

  // `isRead` is used for staff-side unread tracking.
  // Customer -> staff messages start unread; staff -> customer messages are considered read.
  const isStaff = ["ADMIN", "STAFF"].includes(user.role);

  const created = await ChatMessage.create({
    room: room._id,
    sender: user._id,
    message,
    isRead: isStaff,
  });

  room.updatedAt = new Date();
  await room.save();

  return created;
}

module.exports = {
  getOrCreateMyRoom,
  listRooms,
  closeRoom,
  getMessages,
  sendMessage,
};
