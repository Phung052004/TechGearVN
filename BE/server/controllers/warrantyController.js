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

exports.getClaimsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const claims = await warrantyService.getClaimsByOrder(orderId);
    return res.json(claims);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.getAllClaims = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const claims = await warrantyService.getAllClaims(filter);
    return res.json(claims);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await warrantyService.getClaimsStats();
    return res.json(stats);
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

exports.rejectClaim = async (req, res) => {
  try {
    const { reason } = req.body;
    const claim = await warrantyService.rejectClaim(req.params.id, reason);
    return res.json(claim);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.approveClaim = async (req, res) => {
  try {
    const { resolution } = req.body;
    const claim = await warrantyService.approveClaim(req.params.id, resolution);
    return res.json(claim);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};
