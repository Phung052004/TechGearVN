const cartService = require("../services/cartService");

exports.getMyCart = async (req, res) => {
  try {
    const cart = await cartService.getMyCart(req.user._id);
    return res.json(cart);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Replace full cart items: { items: [{ product, quantity }] }
exports.replaceMyCart = async (req, res) => {
  try {
    const cart = await cartService.replaceMyCart(req.user._id, req.body.items);
    return res.json(cart);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

// Add/update one item: { product, quantity }
exports.upsertMyCartItem = async (req, res) => {
  try {
    const cart = await cartService.upsertMyCartItem(req.user._id, req.body);
    return res.json(cart);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.removeMyCartItem = async (req, res) => {
  try {
    const cart = await cartService.removeMyCartItem(
      req.user._id,
      req.params.productId,
    );
    return res.json(cart);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.clearMyCart = async (req, res) => {
  try {
    const cart = await cartService.clearMyCart(req.user._id);
    return res.json(cart);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};
