import { apiClient } from "./apiClient";

export async function createVnpayPayment(orderId) {
  const { data } = await apiClient.post(`/payments/vnpay/create/${orderId}`);
  return data;
}

export async function createMomoPayment(orderId) {
  const { data } = await apiClient.post(`/payments/momo/create/${orderId}`);
  return data;
}

export async function createPayosPayment(orderId) {
  const { data } = await apiClient.post(`/payments/payos/create/${orderId}`);
  return data;
}

// Dev helper: marks order as PAID without gateway
export async function mockMarkPaid(orderId) {
  const { data } = await apiClient.post(`/payments/mock/success/${orderId}`);
  return data;
}
