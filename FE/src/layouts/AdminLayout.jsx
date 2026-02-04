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
            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
            : "text-gray-700 hover:bg-gray-50",
        )
      }
    >
      {children}
    </NavLink>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, isAuthenticated } = useAuth();

  const canAccess = useMemo(() => {
    if (!user) return false;
    return user.role === "ADMIN";
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
          <aside className="hidden lg:block w-[300px] shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="font-extrabold text-gray-900 text-lg">
                Admin Panel
              </div>
              <div className="text-sm text-gray-600 mt-1 line-clamp-1">
                {user?.fullName || user?.email}
              </div>

              <div className="mt-4 space-y-1">
                <SidebarLink to="/admin" end>
                  <span>Dashboard</span>
                </SidebarLink>
                <SidebarLink to="/admin/analytics">
                  <span>Analytics</span>
                </SidebarLink>
                <SidebarLink to="/admin/orders">
                  <span>Đơn hàng</span>
                </SidebarLink>
                <SidebarLink to="/admin/products">
                  <span>Sản phẩm & Kho</span>
                </SidebarLink>
                <SidebarLink to="/admin/users">
                  <span>Users</span>
                </SidebarLink>

                <div className="pt-3 mt-3 border-t border-gray-100">
                  <div className="text-xs font-extrabold text-gray-500 px-3 pb-2">
                    Marketing
                  </div>
                  <SidebarLink to="/admin/marketing/vouchers">
                    <span>Vouchers</span>
                  </SidebarLink>
                  <SidebarLink to="/admin/marketing/banners">
                    <span>Banners</span>
                  </SidebarLink>
                </div>

                <div className="pt-3 mt-3 border-t border-gray-100">
                  <SidebarLink to="/admin/settings">
                    <span>Settings</span>
                  </SidebarLink>
                </div>

                <div className="pt-3 mt-3 border-t border-gray-100">
                  <div className="text-xs font-extrabold text-gray-500 px-3 pb-2">
                    Staff tools (Admin access)
                  </div>
                  <SidebarLink to="/staff/orders">
                    <span>Staff • Đơn hàng</span>
                  </SidebarLink>
                  <SidebarLink to="/staff/products">
                    <span>Staff • Sản phẩm & Kho</span>
                  </SidebarLink>
                  <SidebarLink to="/staff/warranty">
                    <span>Staff • Bảo hành</span>
                  </SidebarLink>
                  <SidebarLink to="/staff/reviews">
                    <span>Staff • Đánh giá</span>
                  </SidebarLink>
                  <SidebarLink to="/staff/vouchers">
                    <span>Staff • Voucher</span>
                  </SidebarLink>
                  <SidebarLink to="/staff/chat">
                    <span>Staff • Chat</span>
                  </SidebarLink>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xl font-extrabold text-gray-900">
                    Khu vực quản trị
                  </div>
                  <div className="text-sm text-gray-600 line-clamp-1">
                    Analytics • Users • Marketing • Settings
                  </div>
                </div>
                <button
                  type="button"
                  className="lg:hidden px-3 py-2 rounded-lg border border-gray-200 font-bold text-sm"
                  onClick={() => navigate("/admin")}
                >
                  Menu
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
