const chatService = require("../services/chatService");

exports.getOrCreateMyRoom = async (req, res) => {
  try {
    const room = await chatService.getOrCreateMyRoom(req.user._id);
    return res.json(room);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.listRooms = async (req, res) => {
  try {
    const rooms = await chatService.listRooms();
    return res.json(rooms);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.closeRoom = async (req, res) => {
  try {
    const saved = await chatService.closeRoom(req.params.roomId);
    return res.json(saved);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { messages } = await chatService.getMessages(
      req.params.roomId,
      req.user,
    );
    return res.json(messages);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const created = await chatService.sendMessage(
      req.params.roomId,
      req.user,
      req.body.message,
    );

    return res.status(201).json(created);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};
