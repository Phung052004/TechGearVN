const express = require("express");
const router = express.Router();
const {
  registerUser,
  confirmRegister,
  resendRegisterCode,
  loginUser,
  googleLogin,
  resetPassword,
  confirmResetPassword,
  verifyEmail,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/register/confirm", confirmRegister);
router.post("/register/resend", resendRegisterCode);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/reset-password", resetPassword);
router.post("/reset-password/confirm", confirmResetPassword);
router.get("/verify-email", verifyEmail);
router.get("/me", protect, getMe);

module.exports = router;
