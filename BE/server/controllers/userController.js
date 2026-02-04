const userService = require("../services/userService");

// GET /api/users/me
exports.getMyProfile = async (req, res) => {
  return res.json(await userService.getMyProfile(req.user));
};

// PUT /api/users/me
// Cho phép update: fullName, email, phone, address, provinceCity
exports.updateMyProfile = async (req, res) => {
  try {
    const updated = await userService.updateMyProfile(req.user._id, req.body);
    return res.json(updated);
  } catch (error) {
    const status = error?.statusCode || 500;
    if (status === 500) console.error("updateMyProfile error:", error);
    return res.status(status).json({ message: error.message });
  }
};
