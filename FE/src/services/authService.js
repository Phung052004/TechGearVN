import { apiClient } from "./apiClient";

export async function login({ email, password }) {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data;
}

export async function register(payload) {
  // Registration is now a 2-step flow (send OTP)
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
}

export async function confirmRegister({ email, code }) {
  const { data } = await apiClient.post("/auth/register/confirm", {
    email,
    code,
  });
  return data;
}

export async function resendRegisterCode(email) {
  const { data } = await apiClient.post("/auth/register/resend", { email });
  return data;
}

export async function logout() {
  const { data } = await apiClient.post("/auth/logout");
  return data;
}

export async function getMe() {
  // Uses existing user profile endpoint
  const { data } = await apiClient.get("/users/me");
  return data;
}

export async function updateMyProfile(payload) {
  const { data } = await apiClient.put("/users/me", payload);
  return data;
}

export async function requestPasswordReset(email) {
  const { data } = await apiClient.post("/auth/reset-password", { email });
  return data;
}

export async function confirmPasswordReset({ token, password }) {
  const { data } = await apiClient.post("/auth/reset-password/confirm", {
    token,
    password,
  });
  return data;
}

export async function verifyEmail(token) {
  const { data } = await apiClient.get("/auth/verify-email", {
    params: { token },
  });
  return data;
}
