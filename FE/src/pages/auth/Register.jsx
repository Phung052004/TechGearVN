import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Thêm useNavigate để chuyển trang
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-toastify"; // Import thư viện thông báo
import axiosClient from "../../api/axiosClient"; // Import API
import { useAuth } from "../../context";

const RegisterPage = () => {
  const navigate = useNavigate(); // Hook để chuyển hướng trang
  const { loginWithGoogle } = useAuth();

  const googleBtnRef = useRef(null);

  const googleClientId = useMemo(
    () => (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim(),
    [],
  );

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Kiểm tra mật khẩu nhập lại
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu nhập lại không khớp!");
      return;
    }

    try {
      // 2. Gọi API đăng ký (Bước 1): gửi mã OTP qua email
      // Đường dẫn '/auth/register' sẽ nối với baseURL '/api/v1' -> '/api/v1/auth/register'
      const res = await axiosClient.post("/auth/register", {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
      });

      // 3. Nếu thành công -> chuyển sang màn nhập mã
      toast.success(
        res?.data?.message ||
          "Đã gửi mã xác nhận về email. Vui lòng nhập mã để hoàn tất đăng ký.",
      );
      const email = encodeURIComponent(formData.email);
      const expiresAt = encodeURIComponent(res?.data?.expiresAt || "");
      navigate(`/verify-register?email=${email}&expiresAt=${expiresAt}`);
    } catch (error) {
      // 4. Nếu lỗi (ví dụ Email trùng)
      const message = error.response?.data?.message || "Đăng ký thất bại";
      toast.error(message);
    }
  };

  useEffect(() => {
    if (!googleClientId) return;

    let disposed = false;

    const init = async () => {
      try {
        const gsi = await waitForGoogleGsiClient({ timeoutMs: 8000 });
        if (disposed) return;
        if (!gsi) return;
        if (!googleBtnRef.current) return;

        try {
          gsi.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response) => {
              const credential = response?.credential;
              if (!credential) {
                toast.error("Đăng nhập Google thất bại");
                return;
              }
              try {
                const result = await loginWithGoogle({ credential });
                toast.success("Đăng nhập thành công!");

                const role = result?.role || result?.user?.role || "";
                if (role === "ADMIN")
                  return navigate("/admin", { replace: true });
                if (role === "STAFF")
                  return navigate("/staff", { replace: true });
                if (role === "DELIVERY")
                  return navigate("/staff/orders", { replace: true });
                return navigate("/", { replace: true });
              } catch (error) {
                const message =
                  error.response?.data?.message || "Đăng nhập Google thất bại";
                toast.error(message);
              }
            },
          });

          googleBtnRef.current.innerHTML = "";
          gsi.accounts.id.renderButton(googleBtnRef.current, {
            theme: "outline",
            size: "large",
            text: "signup_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: "400",
          });
        } catch (renderError) {
          // Silently ignore render errors
          console.debug("Google button render skipped");
        }
      } catch (initError) {
        // Silently catch all Google initialization errors
      }
    };

    init().catch(() => {
      // Catch any unhandled promise rejections
    });

    return () => {
      disposed = true;
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        // ignore
      }
    };
  }, [googleClientId, loginWithGoogle, navigate]);

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-red-600">
          Trang chủ
        </Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900 font-medium">Đăng ký tài khoản</span>
      </div>

      {/* Form Container */}
      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-sm shadow-md">
          <h2 className="text-2xl font-bold text-center mb-6 uppercase">
            Đăng ký tài khoản
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Các ô input giữ nguyên như cũ, chỉ cần đảm bảo name khớp với formData */}

            {/* Họ tên */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và Tên<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-sm focus:outline-none focus:border-blue-500"
                onChange={handleChange}
              />
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại<span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-sm focus:outline-none focus:border-blue-500"
                onChange={handleChange}
              />
            </div>

            {/* Địa chỉ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-sm focus:outline-none focus:border-blue-500"
                onChange={handleChange}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email<span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-sm focus:outline-none focus:border-blue-500"
                onChange={handleChange}
              />
            </div>

            {/* Mật khẩu */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu<span className="text-red-500">*</span>
              </label>
              <input
                type={showPass ? "text" : "password"}
                name="password"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-sm focus:outline-none focus:border-blue-500"
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <FiEye size={18} /> : <FiEyeOff size={18} />}
              </button>
            </div>

            {/* Nhập lại MK */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhập lại mật khẩu<span className="text-red-500">*</span>
              </label>
              <input
                type={showConfirmPass ? "text" : "password"}
                name="confirmPassword"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-sm focus:outline-none focus:border-blue-500"
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
              >
                {showConfirmPass ? <FiEye size={18} /> : <FiEyeOff size={18} />}
              </button>
            </div>

            {/* Nút Đăng ký */}
            <div className="pt-2">
              <button
                type="submit"
                className="bg-secondary hover:bg-red-700 text-white font-bold py-2.5 px-8 rounded-sm transition-colors uppercase text-sm w-full md:w-auto"
              >
                Đăng ký
              </button>
            </div>

            {/* Google Signup/Login */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Hoặc đăng ký bằng
                </span>
              </div>
            </div>

            {googleClientId ? (
              <div className="w-full flex justify-center">
                <div
                  ref={googleBtnRef}
                  className="w-full flex justify-center"
                />
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Google signup chưa được cấu hình (thiếu VITE_GOOGLE_CLIENT_ID).
              </div>
            )}

            {/* Google & Login Link giữ nguyên... */}
            <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
              <Link
                to="/login"
                className="text-gray-600 hover:text-red-600 uppercase font-medium"
              >
                Bạn đã có sẵn tài khoản?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

async function waitForGoogleGsiClient({ timeoutMs }) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const gsi = window.google;
    if (gsi?.accounts?.id?.initialize && gsi?.accounts?.id?.renderButton) {
      return gsi;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
}

export default RegisterPage;
