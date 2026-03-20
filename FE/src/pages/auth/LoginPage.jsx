import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loginWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const googleBtnRef = useRef(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const googleClientId = useMemo(
    () => (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim(),
    [],
  );

  const getSafeNextPath = () => {
    const raw = (searchParams.get("next") || "").trim();
    if (!raw) return "";
    // Only allow internal navigation.
    if (!raw.startsWith("/")) return "";
    if (raw.startsWith("//")) return "";
    return raw;
  };

  const getRoleFromLoginResult = (result) => {
    // Support both shapes: { role } or { user: { role } }
    return result?.role || result?.user?.role || "";
  };

  const isNextAllowedForRole = (role, nextPath) => {
    if (!nextPath) return false;
    // ADMIN: prefer admin area unless explicitly deep-linking into /admin
    if (role === "ADMIN") return nextPath.startsWith("/admin");
    // STAFF: only allow returning to staff area
    if (role === "STAFF" || role === "DELIVERY")
      return nextPath.startsWith("/staff");
    // CUSTOMER/others: avoid privileged areas
    if (nextPath.startsWith("/admin") || nextPath.startsWith("/staff"))
      return false;
    return true;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login(formData);

      // Thông báo & Chuyển hướng
      toast.success("Đăng nhập thành công!");

      const role = getRoleFromLoginResult(result);
      const nextPath = getSafeNextPath();

      if (isNextAllowedForRole(role, nextPath)) {
        navigate(nextPath, { replace: true });
        return;
      }

      if (role === "ADMIN") return navigate("/admin", { replace: true });
      if (role === "STAFF") return navigate("/staff", { replace: true });
      if (role === "DELIVERY")
        return navigate("/staff/orders", { replace: true });
      return navigate("/", { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || "Đăng nhập thất bại";
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

                const role = getRoleFromLoginResult(result);
                const nextPath = getSafeNextPath();

                if (isNextAllowedForRole(role, nextPath)) {
                  navigate(nextPath, { replace: true });
                  return;
                }

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

          // Clean current container in case React re-mounts.
          googleBtnRef.current.innerHTML = "";
          gsi.accounts.id.renderButton(googleBtnRef.current, {
            theme: "outline",
            size: "large",
            text: "signin_with",
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
        // Don't log - just skip Google button
      }
    };

    init().catch(() => {
      // Catch any unhandled promise rejections from init
    });

    return () => {
      disposed = true;
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        // ignore
      }
    };
  }, [googleClientId, loginWithGoogle, navigate, searchParams]);

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-red-600">
          Trang chủ
        </Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900 font-medium">Đăng nhập tài khoản</span>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-sm shadow-md">
          <h2 className="text-2xl font-bold text-center mb-6 uppercase">
            Đăng nhập
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="Nhập email của bạn"
                onChange={handleChange}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu<span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-sm focus:outline-none focus:border-blue-500"
                placeholder="Nhập mật khẩu"
                onChange={handleChange}
              />
            </div>

            {/* Checkbox hiển thị pass */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                <span className="text-sm text-gray-600">Hiển thị mật khẩu</span>
              </label>
            </div>

            {/* Button Login */}
            <button
              type="submit"
              className="bg-secondary hover:bg-red-700 text-white font-bold py-2.5 px-8 rounded-sm transition-colors uppercase text-sm w-full md:w-auto"
            >
              Đăng nhập
            </button>

            {/* Footer Links & Google */}
            {/* ... Giữ nguyên phần Google và Link Đăng ký cũ ... */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Hoặc đăng nhập bằng
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
                Google login chưa được cấu hình (thiếu VITE_GOOGLE_CLIENT_ID).
              </div>
            )}

            <div className="flex justify-between items-center pt-4 text-sm mt-4 border-t border-gray-100">
              <Link
                to="/register"
                className="text-gray-600 hover:text-red-600 uppercase font-medium"
              >
                Đăng ký tài khoản
              </Link>
              <Link
                to="/forgot-password"
                className="text-gray-600 hover:text-red-600"
              >
                Quên mật khẩu?
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
    // Wait a bit for the async script.
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
}

export default LoginPage;
