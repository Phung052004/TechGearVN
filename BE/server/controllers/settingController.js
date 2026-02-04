const settingService = require("../services/settingService");

exports.getSettings = async (req, res) => {
  try {
    const settings = await settingService.getPublicSettings();
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await settingService.updateSettings(req.body);
    return res.json(settings);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};
