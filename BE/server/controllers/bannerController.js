const bannerService = require("../services/bannerService");

exports.getBanners = async (req, res) => {
  try {
    const banners = await bannerService.getBanners({ all: req.query.all });
    return res.json(banners);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const created = await bannerService.createBanner(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const updated = await bannerService.updateBanner(req.params.id, req.body);
    return res.json(updated);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const result = await bannerService.deleteBanner(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};
