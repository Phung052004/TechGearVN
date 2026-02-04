import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";

import { useAuth } from "../context";

function classNames(...parts) {
  return parts.filter(Boolean).join(" ");
}

function SidebarLink({ to, children, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        classNames(
          "flex items-center justify-between gap-3 px-3 py-2 rounded-lg font-bold text-sm",
          isActive
            ? "bg-blue-50 text-blue-700 border border-blue-100"
            : "text-gray-700 hover:bg-gray-50",
        )
      }
    >
      {children}
    </NavLink>
  );
}

export default function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, isAuthenticated } = useAuth();

  const canAccess = useMemo(() => {
    if (!user) return false;
    return user.role === "STAFF" || user.role === "ADMIN";
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (!canAccess) {
      navigate("/", { replace: true });
    }
  }, [loading, isAuthenticated, canAccess, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-[70vh] grid place-items-center bg-gray-50">
        <div className="text-gray-600 font-bold">Đang tải...</div>
      </div>
    );
  }

  if (!isAuthenticated || !canAccess) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-start gap-6">
          <aside className="hidden lg:block w-[280px] shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="font-extrabold text-gray-900 text-lg">
                Staff Panel
              </div>
              <div className="text-sm text-gray-600 mt-1 line-clamp-1">
                {user?.fullName || user?.email}
              </div>

              <div className="mt-4 space-y-1">
                <SidebarLink to="/staff" end>
                  <span>Dashboard</span>
                </SidebarLink>
                <SidebarLink to="/staff/orders">
                  <span>Đơn hàng</span>
                </SidebarLink>
                <SidebarLink to="/staff/products">
                  <span>Sản phẩm & Kho</span>
                </SidebarLink>
                <SidebarLink to="/staff/warranty">
                  <span>Bảo hành</span>
                </SidebarLink>
                <SidebarLink to="/staff/reviews">
                  <span>Đánh giá</span>
                </SidebarLink>
                <SidebarLink to="/staff/vouchers">
                  <span>Voucher</span>
                </SidebarLink>
                <SidebarLink to="/staff/chat">
                  <span>Chat</span>
                </SidebarLink>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xl font-extrabold text-gray-900">
                    Khu vực nhân viên
                  </div>
                  <div className="text-sm text-gray-600 line-clamp-1">
                    Xử lý đơn hàng • Quản lý kho • Chăm sóc khách hàng
                  </div>
                </div>
                <button
                  type="button"
                  className="lg:hidden px-3 py-2 rounded-lg border border-gray-200 font-bold text-sm"
                  onClick={() => navigate("/staff")}
                >
                  Menu
                </button>
              </div>
            </div>

            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
