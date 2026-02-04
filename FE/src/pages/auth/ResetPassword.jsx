import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { confirmPasswordReset } from "../../services/authService";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(
    () => (searchParams.get("token") ?? "").trim(),
    [searchParams],
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Thiếu token đặt lại mật khẩu");
      return;
    }

    if (password.trim().length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu nhập lại không khớp");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await confirmPasswordReset({
        token,
        password: password.trim(),
      });
      toast.success(res?.message || "Đặt lại mật khẩu thành công");
      navigate("/login");
    } catch (error) {
      const message =
        error?.response?.data?.message || "Đặt lại mật khẩu thất bại";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="container mx-auto px-4 py-4 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-red-600">
          Trang chủ
        </Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900 font-medium">Đặt lại mật khẩu</span>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-sm shadow-md">
          <h2 className="text-2xl font-bold text-center mb-2 uppercase">
            Đặt lại mật khẩu
          </h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            Nhập mật khẩu mới cho tài khoản của bạn.
          </p>

          {!token ? (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-3">
              Link không hợp lệ hoặc thiếu token. Vui lòng thử lại từ email quên
              mật khẩu.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới<span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhập lại mật khẩu<span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || !token}
                style={{
                  width: "100%",
                  background: "#0b4950",
                  color: "white",
                  borderColor: "#0b4950",
                  opacity: isSubmitting || !token ? 0.7 : 1,
                }}
              >
                {isSubmitting ? "Đang lưu..." : "Cập nhật mật khẩu"}
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 text-sm flex justify-between">
              <Link
                to="/login"
                className="text-gray-600 hover:text-red-600 uppercase font-medium"
              >
                Đăng nhập
              </Link>
              <Link
                to="/forgot-password"
                className="text-gray-600 hover:text-red-600 uppercase font-medium"
              >
                Gửi lại link
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
