const warrantyService = require("../services/warrantyService");

exports.createClaim = async (req, res) => {
  try {
    const created = await warrantyService.createClaim(req.user._id, req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.getMyClaims = async (req, res) => {
  try {
    const claims = await warrantyService.getMyClaims(req.user._id);
    return res.json(claims);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.getAllClaims = async (req, res) => {
  try {
    const claims = await warrantyService.getAllClaims();
    return res.json(claims);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.updateClaim = async (req, res) => {
  try {
    const saved = await warrantyService.updateClaim(req.params.id, req.body);
    return res.json(saved);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};
