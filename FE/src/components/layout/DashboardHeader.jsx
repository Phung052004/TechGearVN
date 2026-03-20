import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context";
import { IoHome, IoLogOut } from "react-icons/io5";
import { toast } from "react-toastify";

export default function DashboardHeader({ title, subtitle }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đã đăng xuất");
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      // Even if error, still logout locally and redirect
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-xl font-extrabold text-gray-900">{title}</div>
          {subtitle && (
            <div className="text-sm text-gray-600 line-clamp-1">{subtitle}</div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 font-semibold text-sm transition-colors"
            title="Về trang chủ"
          >
            <IoHome size={18} />
            <span className="hidden sm:inline">Trang chủ</span>
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-semibold text-sm transition-colors"
            title="Đăng xuất"
          >
            <IoLogOut size={18} />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
}
