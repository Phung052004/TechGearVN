const userAdminService = require("../services/userAdminService");

exports.listUsers = async (req, res) => {
  try {
    const users = await userAdminService.listUsers({
      q: req.query?.q,
      role: req.query?.role,
      blocked: req.query?.blocked,
    });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await userAdminService.createUser(req.body);
    return res.status(201).json(user);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.setUserBlocked = async (req, res) => {
  try {
    const user = await userAdminService.setBlocked(req.params.id, req.body);
    return res.json(user);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.setUserRole = async (req, res) => {
  try {
    const user = await userAdminService.setRole(req.params.id, req.body);
    return res.json(user);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};
