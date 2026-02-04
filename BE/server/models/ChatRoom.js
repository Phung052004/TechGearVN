const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
