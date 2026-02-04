import { apiClient } from "./apiClient";

export async function createOrder(payload) {
  const { data } = await apiClient.post("/orders", payload);
  return data;
}

export async function getMyOrders() {
  const { data } = await apiClient.get("/orders/me");
  return data;
}

export async function getOrderById(orderId) {
  const { data } = await apiClient.get(`/orders/${orderId}`);
  return data;
}

export async function getAllOrders() {
  const { data } = await apiClient.get("/orders");
  return data?.data ?? data;
}

export async function updateOrderStatus(orderId, payload) {
  const { data } = await apiClient.put(`/orders/${orderId}/status`, payload);
  return data?.data ?? data;
}
