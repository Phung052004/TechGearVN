import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { verifyEmail } from "../../services/authService";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = useMemo(
    () => (searchParams.get("token") ?? "").trim(),
    [searchParams],
  );

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!token) {
        if (!isMounted) return;
        setStatus("error");
        setMessage("Thiếu token xác thực");
        return;
      }

      try {
        const res = await verifyEmail(token);
        if (!isMounted) return;
        setStatus("success");
        setMessage(res?.message || "Xác thực email thành công");
        toast.success(res?.message || "Xác thực email thành công");
      } catch (error) {
        const msg = error?.response?.data?.message || "Xác thực email thất bại";
        if (!isMounted) return;
        setStatus("error");
        setMessage(msg);
        toast.error(msg);
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const panelClass =
    status === "success"
      ? "bg-green-50 border-green-100 text-green-700"
      : status === "error"
        ? "bg-red-50 border-red-100 text-red-700"
        : "bg-gray-50 border-gray-100 text-gray-700";

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="container mx-auto px-4 py-4 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-red-600">
          Trang chủ
        </Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900 font-medium">Xác thực email</span>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-sm shadow-md">
          <h2 className="text-2xl font-bold text-center mb-2 uppercase">
            Xác thực email
          </h2>

          <div className={`text-sm border rounded p-3 ${panelClass}`}>
            {status === "loading" ? "Đang xác thực..." : message}
          </div>

          <div className="mt-6 text-sm flex justify-between">
            <Link
              to="/login"
              className="text-gray-600 hover:text-red-600 uppercase font-medium"
            >
              Đăng nhập
            </Link>
            <Link
              to="/"
              className="text-gray-600 hover:text-red-600 uppercase font-medium"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
