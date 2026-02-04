const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { createHttpError } = require("../utils/httpError");

function normalize(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function listUsers({ q, role, blocked } = {}) {
  const query = {};

  const keyword = normalize(q);
  if (keyword) {
    query.$or = [
      { email: { $regex: keyword, $options: "i" } },
      { fullName: { $regex: keyword, $options: "i" } },
    ];
  }

  const roleValue = normalize(role);
  if (roleValue) query.role = roleValue;

  if (blocked !== undefined) {
    const b = String(blocked).trim().toLowerCase();
    if (b === "true" || b === "1") query.isBlocked = true;
    if (b === "false" || b === "0") query.isBlocked = false;
  }

  return User.find(query)
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(500);
}

async function createUser({ fullName, email, password, role } = {}) {
  const nextFullName = normalize(fullName);
  const nextEmail = normalize(email);
  const nextPassword = typeof password === "string" ? password.trim() : "";

  if (!nextFullName || !nextEmail || !nextPassword) {
    throw createHttpError(400, "Thiếu fullName/email/password");
  }

  if (nextPassword.length < 6) {
    throw createHttpError(400, "Mật khẩu phải có ít nhất 6 ký tự");
  }

  const desiredRole = normalize(role) || "STAFF";
  if (!["CUSTOMER", "STAFF", "ADMIN", "DELIVERY"].includes(desiredRole)) {
    throw createHttpError(400, "role không hợp lệ");
  }

  const exists = await User.findOne({ email: nextEmail });
  if (exists) throw createHttpError(400, "Email đã được sử dụng");

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(nextPassword, salt);

  const created = await User.create({
    fullName: nextFullName,
    email: nextEmail,
    password: passwordHash,
    role: desiredRole,
    isVerified: true,
  });

  const safeUser = await User.findById(created._id).select("-password");
  return safeUser;
}

async function setBlocked(userId, { isBlocked } = {}) {
  const value = Boolean(isBlocked);

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: { isBlocked: value } },
    { new: true },
  ).select("-password");

  if (!updated) throw createHttpError(404, "Không tìm thấy user");
  return updated;
}

async function setRole(userId, { role } = {}) {
  const desiredRole = normalize(role);
  if (!desiredRole) throw createHttpError(400, "Thiếu role");
  if (!["CUSTOMER", "STAFF", "ADMIN", "DELIVERY"].includes(desiredRole)) {
    throw createHttpError(400, "role không hợp lệ");
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: { role: desiredRole } },
    { new: true },
  ).select("-password");

  if (!updated) throw createHttpError(404, "Không tìm thấy user");
  return updated;
}

module.exports = { listUsers, createUser, setBlocked, setRole };
