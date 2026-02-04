const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { createHttpError } = require("../utils/httpError");

async function buildCartItem({ productId, quantity }) {
  const product = await Product.findById(productId);
  if (!product) return null;

  return {
    product: product._id,
    quantity,
    productName: product.name,
    price: product.price,
    thumbnail: product.thumbnail || product.image,
  };
}

async function getMyCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate(
    "items.product",
    "name price thumbnail image",
  );

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
}

async function replaceMyCart(userId, items) {
  const sourceItems = Array.isArray(items) ? items : [];

  const newItems = [];
  for (const item of sourceItems) {
    const productId = item?.product;
    const quantity = Number(item?.quantity || 0);
    if (!productId || quantity <= 0) continue;

    const built = await buildCartItem({ productId, quantity });
    if (built) newItems.push(built);
  }

  return Cart.findOneAndUpdate(
    { user: userId },
    { $set: { items: newItems } },
    { new: true, upsert: true },
  );
}

async function upsertMyCartItem(userId, { product, quantity } = {}) {
  const productId = product;
  const qty = Number(quantity || 0);

  if (!productId || qty <= 0) {
    throw createHttpError(400, "Thiếu product hoặc quantity");
  }

  const built = await buildCartItem({ productId, quantity: qty });
  if (!built) throw createHttpError(404, "Không tìm thấy sản phẩm");

  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });

  const idx = cart.items.findIndex(
    (i) => String(i.product) === String(productId),
  );
  if (idx >= 0) cart.items[idx] = built;
  else cart.items.push(built);

  await cart.save();
  return cart;
}

async function removeMyCartItem(userId, productId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return { user: userId, items: [] };

  cart.items = cart.items.filter(
    (i) => String(i.product) !== String(productId),
  );
  await cart.save();
  return cart;
}

async function clearMyCart(userId) {
  return Cart.findOneAndUpdate(
    { user: userId },
    { $set: { items: [] } },
    { new: true, upsert: true },
  );
}

module.exports = {
  getMyCart,
  replaceMyCart,
  upsertMyCartItem,
  removeMyCartItem,
  clearMyCart,
};
