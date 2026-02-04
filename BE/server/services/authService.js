const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");
const { sendEmail } = require("../utils/mailer");
const { createHttpError } = require("../utils/httpError");

const FRONTEND_URL =
  (process.env.FRONTEND_URL ?? "").trim() || "http://localhost:5173";

const REGISTER_OTP_TTL_MINUTES = Number(
  (process.env.REGISTER_OTP_TTL_MINUTES ?? "").trim() || "10",
);

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

function minutesFromNow(m) {
  return new Date(Date.now() + m * 60 * 1000);
}

function hoursFromNow(h) {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

function createOtpCode() {
  const code = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  return { code, hash };
}

function createOneTimeToken() {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

function getOtpTtlMinutes() {
  return Number.isFinite(REGISTER_OTP_TTL_MINUTES) &&
    REGISTER_OTP_TTL_MINUTES > 0
    ? REGISTER_OTP_TTL_MINUTES
    : 10;
}

async function startRegister({ fullName, email, password, phone, address }) {
  if (!fullName || !email || !password) {
    throw createHttpError(400, "Thiếu thông tin bắt buộc");
  }

  if (typeof password !== "string" || password.trim().length < 6) {
    throw createHttpError(400, "Mật khẩu phải có ít nhất 6 ký tự");
  }

  const userExists = await User.findOne({ email });
  if (userExists) throw createHttpError(400, "Email đã được sử dụng");

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const { code, hash: codeHash } = createOtpCode();
  const expireAt = minutesFromNow(getOtpTtlMinutes());

  await PendingRegistration.findOneAndUpdate(
    { email },
    {
      $set: {
        fullName,
        email,
        passwordHash,
        phone,
        address,
        codeHash,
        codeExpire: expireAt,
        lastSentAt: new Date(),
      },
      $inc: { resendCount: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await sendEmail({
    to: email,
    subject: "Mã xác nhận đăng ký - TechGear",
    text: `Chào ${fullName},\n\nMã xác nhận đăng ký của bạn là: ${code}\n\nMã sẽ hết hạn sau ${getOtpTtlMinutes()} phút.`,
    html: `
      <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">
        <h2 style="margin:0 0 12px">Xác nhận đăng ký</h2>
        <p>Chào <b>${fullName}</b>,</p>
        <p>Mã xác nhận đăng ký của bạn là:</p>
        <p style="font-size:28px;font-weight:800;letter-spacing:6px;margin:12px 0;color:#0b4950">${code}</p>
        <p style="color:#6b7280">Mã sẽ hết hạn sau ${getOtpTtlMinutes()} phút.</p>
      </div>
    `.trim(),
  });

  return {
    message:
      "Đã gửi mã xác nhận về email. Vui lòng nhập mã để hoàn tất đăng ký.",
    email,
    expiresAt: expireAt.toISOString(),
  };
}

async function confirmRegister({ email, code }) {
  const emailTrimmed = (email ?? "").trim();
  const codeTrimmed = String(code ?? "").trim();

  if (!emailTrimmed || !codeTrimmed) {
    throw createHttpError(400, "Thiếu email hoặc mã xác nhận");
  }

  const pending = await PendingRegistration.findOne({ email: emailTrimmed });
  if (!pending) {
    throw createHttpError(
      400,
      "Không tìm thấy yêu cầu đăng ký hoặc đã hết hạn",
    );
  }

  if (!pending.codeExpire || pending.codeExpire <= new Date()) {
    await PendingRegistration.deleteOne({ _id: pending._id });
    throw createHttpError(400, "Mã xác nhận đã hết hạn");
  }

  const codeHash = crypto
    .createHash("sha256")
    .update(codeTrimmed)
    .digest("hex");
  if (codeHash !== pending.codeHash) {
    throw createHttpError(400, "Mã xác nhận không đúng");
  }

  const userExists = await User.findOne({ email: emailTrimmed });
  if (userExists) {
    await PendingRegistration.deleteOne({ _id: pending._id });
    throw createHttpError(400, "Email đã được sử dụng");
  }

  const user = await User.create({
    fullName: pending.fullName,
    email: pending.email,
    phone: pending.phone,
    address: pending.address,
    password: pending.passwordHash,
    isVerified: true,
  });

  await PendingRegistration.deleteOne({ _id: pending._id });

  return {
    message: "Đăng ký thành công",
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    token: generateToken(user._id),
  };
}

async function resendRegisterCode(email) {
  const emailTrimmed = (email ?? "").trim();
  if (!emailTrimmed) throw createHttpError(400, "Thiếu email");

  const pending = await PendingRegistration.findOne({ email: emailTrimmed });
  if (!pending) {
    throw createHttpError(400, "Không tìm thấy yêu cầu đăng ký để gửi lại mã");
  }

  const { code, hash: codeHash } = createOtpCode();
  const expireAt = minutesFromNow(getOtpTtlMinutes());

  pending.codeHash = codeHash;
  pending.codeExpire = expireAt;
  pending.lastSentAt = new Date();
  pending.resendCount = (pending.resendCount || 0) + 1;
  await pending.save();

  await sendEmail({
    to: pending.email,
    subject: "Mã xác nhận đăng ký (gửi lại) - TechGear",
    text: `Chào ${pending.fullName},\n\nMã xác nhận đăng ký của bạn là: ${code}\n\nMã sẽ hết hạn sau ${getOtpTtlMinutes()} phút.`,
    html: `
      <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">
        <h2 style="margin:0 0 12px">Mã xác nhận (gửi lại)</h2>
        <p>Chào <b>${pending.fullName}</b>,</p>
        <p>Mã xác nhận đăng ký của bạn là:</p>
        <p style="font-size:28px;font-weight:800;letter-spacing:6px;margin:12px 0;color:#0b4950">${code}</p>
        <p style="color:#6b7280">Mã sẽ hết hạn sau ${getOtpTtlMinutes()} phút.</p>
      </div>
    `.trim(),
  });

  return {
    message: "Đã gửi lại mã xác nhận về email.",
    email: emailTrimmed,
    expiresAt: expireAt.toISOString(),
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw createHttpError(401, "Email hoặc mật khẩu không đúng");
  }

  if (user.isVerified === false) {
    throw createHttpError(403, "Tài khoản chưa được xác thực email");
  }

  if (user.isBlocked) {
    throw createHttpError(403, "Tài khoản đã bị khóa");
  }

  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    token: generateToken(user._id),
  };
}

async function requestPasswordReset(email) {
  const emailTrimmed = (email ?? "").trim();
  const genericResponse = {
    message: "Nếu email tồn tại, hệ thống đã gửi link đặt lại mật khẩu.",
  };

  if (!emailTrimmed) return genericResponse;

  const user = await User.findOne({ email: emailTrimmed });
  if (!user) return genericResponse;

  const { raw, hash } = createOneTimeToken();
  user.resetPasswordToken = hash;
  user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  const resetLink = `${FRONTEND_URL}/reset-password?token=${raw}`;
  await sendEmail({
    to: user.email,
    subject: "Đặt lại mật khẩu - TechGear",
    text: `Chào ${user.fullName},\n\nBạn vừa yêu cầu đặt lại mật khẩu. Link: ${resetLink}\n\nLink sẽ hết hạn sau 30 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.`,
    html: `
      <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">
        <h2 style="margin:0 0 12px">Đặt lại mật khẩu</h2>
        <p>Chào <b>${user.fullName}</b>,</p>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu. Bấm nút bên dưới để tiếp tục:</p>
        <p style="margin:16px 0">
          <a href="${resetLink}" style="display:inline-block;background:#0b4950;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">Đặt lại mật khẩu</a>
        </p>
        <p>Nếu nút không hoạt động, copy link này vào trình duyệt:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p style="color:#6b7280">Link sẽ hết hạn sau 30 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      </div>
    `.trim(),
  });

  return genericResponse;
}

async function confirmPasswordReset({ token, password }) {
  const tokenTrimmed = (token ?? "").trim();
  const passwordValue = password;

  if (
    !tokenTrimmed ||
    typeof passwordValue !== "string" ||
    passwordValue.trim().length < 6
  ) {
    throw createHttpError(400, "Token hoặc mật khẩu không hợp lệ");
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(tokenTrimmed)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: tokenHash,
    resetPasswordExpire: { $gt: new Date() },
  });

  if (!user) {
    throw createHttpError(400, "Token không hợp lệ hoặc đã hết hạn");
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(passwordValue.trim(), salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return { message: "Đặt lại mật khẩu thành công" };
}

async function verifyEmail(token) {
  const tokenTrimmed = (token ?? "").trim();
  if (!tokenTrimmed) throw createHttpError(400, "Thiếu token");

  const tokenHash = crypto
    .createHash("sha256")
    .update(tokenTrimmed)
    .digest("hex");

  const user = await User.findOne({
    emailVerifyToken: tokenHash,
    emailVerifyExpire: { $gt: new Date() },
  });

  if (!user) throw createHttpError(400, "Token không hợp lệ hoặc đã hết hạn");

  user.isVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpire = undefined;
  await user.save();

  return { message: "Xác thực email thành công" };
}

async function getMe(userFromMiddleware) {
  return userFromMiddleware;
}

module.exports = {
  startRegister,
  confirmRegister,
  resendRegisterCode,
  login,
  requestPasswordReset,
  confirmPasswordReset,
  verifyEmail,
  getMe,
  // exported for reuse/tests
  hoursFromNow,
};
