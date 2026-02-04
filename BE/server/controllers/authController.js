const authService = require("../services/authService");

// --- ĐĂNG KÝ (BƯỚC 1): GỬI MÃ OTP QUA EMAIL ---
// POST /api/auth/register
exports.registerUser = async (req, res) => {
  try {
    const result = await authService.startRegister(req.body);
    return res.json(result);
  } catch (error) {
    const status = error?.statusCode || 500;
    if (status === 500) console.error("registerUser error:", error);
    return res.status(status).json({ message: error.message });
  }
};

// --- ĐĂNG KÝ (BƯỚC 2): XÁC NHẬN OTP VÀ TẠO USER THẬT ---
// POST /api/auth/register/confirm { email, code }
exports.confirmRegister = async (req, res) => {
  try {
    const result = await authService.confirmRegister(req.body);
    return res.status(201).json(result);
  } catch (error) {
    const status = error?.statusCode || 500;
    if (status === 500) console.error("confirmRegister error:", error);
    return res.status(status).json({ message: error.message });
  }
};

// --- ĐĂNG KÝ (GỬI LẠI OTP) ---
// POST /api/auth/register/resend { email }
exports.resendRegisterCode = async (req, res) => {
  try {
    const result = await authService.resendRegisterCode(req.body?.email);
    return res.json(result);
  } catch (error) {
    const status = error?.statusCode || 500;
    if (status === 500) console.error("resendRegisterCode error:", error);
    return res.status(status).json({ message: error.message });
  }
};

// --- ĐĂNG NHẬP ---
exports.loginUser = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    return res.json(result);
  } catch (error) {
    const status = error?.statusCode || 500;
    if (status === 500) console.error("loginUser error:", error);
    return res.status(status).json({ message: error.message });
  }
};

// --- QUÊN MẬT KHẨU: GỬI LINK RESET QUA EMAIL ---
// POST /api/auth/reset-password { email }
exports.resetPassword = async (req, res) => {
  try {
    const result = await authService.requestPasswordReset(req.body?.email);
    return res.json(result);
  } catch (error) {
    const status = error?.statusCode || 500;
    if (status === 500) console.error("resetPassword error:", error);
    return res.status(status).json({ message: error.message });
  }
};

// --- XÁC NHẬN RESET PASSWORD ---
// POST /api/auth/reset-password/confirm { token, password }
exports.confirmResetPassword = async (req, res) => {
  try {
    const result = await authService.confirmPasswordReset(req.body);
    return res.json(result);
  } catch (error) {
    const status = error?.statusCode || 500;
    if (status === 500) console.error("confirmResetPassword error:", error);
    return res.status(status).json({ message: error.message });
  }
};

// --- XÁC THỰC EMAIL ---
// GET /api/auth/verify-email?token=...
exports.verifyEmail = async (req, res) => {
  try {
    const result = await authService.verifyEmail(req.query?.token);
    return res.json(result);
  } catch (error) {
    const status = error?.statusCode || 500;
    if (status === 500) console.error("verifyEmail error:", error);
    return res.status(status).json({ message: error.message });
  }
};

// --- LẤY THÔNG TIN USER HIỆN TẠI ---
exports.getMe = async (req, res) => {
  return res.json(await authService.getMe(req.user));
};
