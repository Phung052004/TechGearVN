const savedBuildService = require("../services/savedBuildService");

exports.getMyBuilds = async (req, res) => {
  try {
    const builds = await savedBuildService.getMyBuilds(req.user._id);
    return res.json(builds);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.createBuild = async (req, res) => {
  try {
    const created = await savedBuildService.createBuild(req.user._id, req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.getBuildByIdOrShare = async (req, res) => {
  try {
    const build = await savedBuildService.getBuildByIdOrShare(
      req.user._id,
      req.params.idOrShare,
    );
    return res.json(build);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.getBuildByShareLink = async (req, res) => {
  try {
    const build = await savedBuildService.getBuildByShareLink(
      req.params.shareLink,
    );
    return res.json(build);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.updateBuild = async (req, res) => {
  try {
    const saved = await savedBuildService.updateBuild(
      req.user._id,
      req.params.id,
      req.body,
    );
    return res.json(saved);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.deleteBuild = async (req, res) => {
  try {
    const result = await savedBuildService.deleteBuild(
      req.user._id,
      req.params.id,
    );
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};
