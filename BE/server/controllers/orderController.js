const orderService = require("../services/orderService");

exports.createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.user, req.body);
    return res.status(201).json(order);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await orderService.getMyOrders(req.user._id);
    return res.json(orders);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById({
      id: req.params.id,
      user: req.user,
    });

    return res.json(order);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    return res.json(orders);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const saved = await orderService.updateOrderStatus(req.params.id, req.body);
    return res.json(saved);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};
