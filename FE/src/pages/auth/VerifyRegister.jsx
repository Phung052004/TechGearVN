import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import {
  confirmRegister,
  resendRegisterCode,
} from "../../services/authService";

function formatCountdown(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function VerifyRegister() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = useMemo(
    () => (searchParams.get("email") ?? "").trim(),
    [searchParams],
  );
  const expiresAtRaw = useMemo(
    () => (searchParams.get("expiresAt") ?? "").trim(),
    [searchParams],
  );

  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState(
    expiresAtRaw ? new Date(expiresAtRaw) : null,
  );
  const [now, setNow] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const remainingMs = useMemo(() => {
    if (!expiresAt) return 0;
    const ms = expiresAt.getTime() - now;
    return ms > 0 ? ms : 0;
  }, [expiresAt, now]);

  const handleConfirm = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Thiếu email đăng ký");
      return;
    }

    const trimmed = code.trim();
    if (!/^[0-9]{6}$/.test(trimmed)) {
      toast.error("Vui lòng nhập mã 6 chữ số");
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await confirmRegister({ email, code: trimmed });

      // Auto-login after successful verification
      if (data?.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        window.dispatchEvent(new Event("auth:changed"));
      }

      toast.success(data?.message || "Đăng ký thành công");
      navigate("/");
    } catch (error) {
      const message = error?.response?.data?.message || "Xác nhận mã thất bại";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Thiếu email đăng ký");
      return;
    }

    try {
      setIsResending(true);
      const data = await resendRegisterCode(email);
      toast.success(data?.message || "Đã gửi lại mã xác nhận");
      if (data?.expiresAt) setExpiresAt(new Date(data.expiresAt));
    } catch (error) {
      const message = error?.response?.data?.message || "Gửi lại mã thất bại";
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  const disabled = isSubmitting || !email;

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="container mx-auto px-4 py-4 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-red-600">
          Trang chủ
        </Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900 font-medium">Xác nhận đăng ký</span>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-sm shadow-md">
          <h2 className="text-2xl font-bold text-center mb-2 uppercase">
            Nhập mã xác nhận
          </h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            Mã đã được gửi tới <b>{email || "(thiếu email)"}</b>.
          </p>

          <div className="text-sm text-gray-600 mb-3 flex justify-between">
            <span>Thời gian còn lại:</span>
            <span
              className={
                remainingMs > 0 ? "font-semibold" : "text-red-600 font-semibold"
              }
            >
              {formatCountdown(remainingMs)}
            </span>
          </div>

          <form onSubmit={handleConfirm} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã 6 chữ số<span className="text-red-500">*</span>
              </label>
              <Input
                inputMode="numeric"
                placeholder="______"
                value={code}
                maxLength={6}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, "");
                  setCode(next);
                }}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={disabled}
                style={{
                  width: "100%",
                  background: "#0b4950",
                  color: "white",
                  borderColor: "#0b4950",
                  opacity: disabled ? 0.7 : 1,
                }}
              >
                {isSubmitting ? "Đang xác nhận..." : "Xác nhận"}
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                style={{
                  width: "100%",
                  borderColor: "#0b4950",
                  opacity: isResending ? 0.7 : 1,
                }}
              >
                {isResending ? "Đang gửi..." : "Gửi lại mã"}
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 text-sm flex justify-between">
              <Link
                to="/register"
                className="text-gray-600 hover:text-red-600 uppercase font-medium"
              >
                Đổi email
              </Link>
              <Link
                to="/login"
                className="text-gray-600 hover:text-red-600 uppercase font-medium"
              >
                Đăng nhập
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
