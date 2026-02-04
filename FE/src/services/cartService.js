import { apiClient } from "./apiClient";

export async function getCart() {
  const { data } = await apiClient.get("/carts/me");
  return data;
}

export async function addToCart({ productId, quantity = 1 }) {
  const { data } = await apiClient.post("/carts/me/items", {
    product: productId,
    quantity,
  });
  return data;
}

export async function updateCartItem({ productId, itemId, quantity }) {
  // Backend uses productId (not cart item id) because CartItem has _id disabled.
  const pid = productId ?? itemId;
  const { data } = await apiClient.post("/carts/me/items", {
    product: pid,
    quantity,
  });
  return data;
}

export async function removeCartItem(productId) {
  const { data } = await apiClient.delete(`/carts/me/items/${productId}`);
  return data;
}

export async function clearCart() {
  const { data } = await apiClient.delete("/carts/me");
  return data;
}
