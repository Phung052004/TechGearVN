import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { requestPasswordReset } from "../../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await requestPasswordReset(email.trim());
      toast.success(
        res?.message || "Đã gửi link đặt lại mật khẩu (nếu email tồn tại)",
      );
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Gửi yêu cầu thất bại (vui lòng kiểm tra cấu hình email)";
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
        <span className="text-gray-900 font-medium">Quên mật khẩu</span>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-sm shadow-md">
          <h2 className="text-2xl font-bold text-center mb-2 uppercase">
            Quên mật khẩu
          </h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            Nhập email để nhận link đặt lại mật khẩu.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email<span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  background: "#0b4950",
                  color: "white",
                  borderColor: "#0b4950",
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 text-sm flex justify-between">
              <Link
                to="/login"
                className="text-gray-600 hover:text-red-600 uppercase font-medium"
              >
                Quay lại đăng nhập
              </Link>
              <Link
                to="/register"
                className="text-gray-600 hover:text-red-600 uppercase font-medium"
              >
                Tạo tài khoản
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
