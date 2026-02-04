import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiUser,
  FiFileText,
  FiLock,
  FiLogOut,
  FiHelpCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { getMe, updateMyProfile } from "../../services/authService";
import Modal from "../../components/common/Modal";
import { orderService } from "../../services";

function formatVnd(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price ?? 0);
}

function formatDateTime(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(value);
  }
}

function orderStatusLabel(status) {
  switch (status) {
    case "PENDING":
      return "Chờ xác nhận";
    case "PROCESSING":
      return "Đang xử lý";
    case "SHIPPING":
      return "Đang giao";
    case "COMPLETED":
      return "Hoàn thành";
    case "CANCELLED":
      return "Đã hủy";
    case "RETURNED":
      return "Đã trả";
    default:
      return status || "";
  }
}

function paymentStatusLabel(status) {
  switch (status) {
    case "UNPAID":
      return "Chưa thanh toán";
    case "PAID":
      return "Đã thanh toán";
    default:
      return status || "";
  }
}

function badgeClass(kind) {
  switch (kind) {
    case "success":
      return "bg-green-50 text-green-700 border-green-100";
    case "danger":
      return "bg-red-50 text-red-700 border-red-100";
    case "warning":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "info":
      return "bg-blue-50 text-blue-700 border-blue-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-100";
  }
}

function orderStatusKind(status) {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "danger";
    case "RETURNED":
      return "warning";
    case "SHIPPING":
      return "info";
    default:
      return "default";
  }
}

function paymentStatusKind(status) {
  return status === "PAID" ? "success" : "default";
}

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const view = (searchParams.get("view") || "info").toLowerCase();

  const readAuthFromStorage = () => {
    const token = localStorage.getItem("token");
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      user = null;
    }
    return { token, user };
  };

  const [{ token, user }, setAuth] = useState(() => readAuthFromStorage());
  const [openLogout, setOpenLogout] = useState(false);
  const [meLoading, setMeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    address: "",
    provinceCity: "",
    phone: "",
  });

  useEffect(() => {
    const sync = () => setAuth(readAuthFromStorage());
    window.addEventListener("auth:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  useEffect(() => {
    const loadMe = async () => {
      if (!token) return;
      setMeLoading(true);
      try {
        const me = await getMe();

        // Keep existing shape compatible with current code (user in localStorage previously included token)
        const mergedUser = { ...(me || {}), token };
        localStorage.setItem("user", JSON.stringify(mergedUser));
        setAuth((prev) => ({ ...prev, user: mergedUser }));
        window.dispatchEvent(new Event("auth:changed"));
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.dispatchEvent(new Event("auth:changed"));
          navigate("/login", { replace: true });
          return;
        }
        toast.error("Không thể tải thông tin tài khoản");
      } finally {
        setMeLoading(false);
      }
    };

    loadMe();
  }, [token, navigate]);

  useEffect(() => {
    // Initialize form from fetched user
    if (!user) return;
    setProfileForm({
      fullName: user?.fullName || "",
      email: user?.email || "",
      address: user?.address || "",
      provinceCity: user?.provinceCity || "",
      phone: user?.phone || "",
    });
  }, [user]);

  const displayName = user?.fullName || user?.name || "Tài khoản";

  const menuItems = useMemo(
    () => [
      {
        key: "info",
        label: "Thông tin tài khoản",
        icon: FiUser,
      },
      {
        key: "order",
        label: "Quản lý đơn hàng",
        icon: FiFileText,
      },
      {
        key: "change-pass",
        label: "Thay đổi mật khẩu",
        icon: FiLock,
      },
    ],
    [],
  );

  const setView = (nextView) => {
    setSearchParams({ view: nextView });
  };

  const loadOrders = async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const data = await orderService.getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("auth:changed"));
        navigate("/login", { replace: true });
        return;
      }
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (view !== "order") return;
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, token]);

  const handleLogoutConfirmed = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth:changed"));
    toast.success("Đã đăng xuất");
    navigate("/", { replace: true });
  };

  const onSubmitProfile = (e) => {
    e.preventDefault();
    const run = async () => {
      if (!token) return;
      setSaveLoading(true);
      try {
        const clean = (value) => {
          if (typeof value !== "string") return undefined;
          const trimmed = value.trim();
          return trimmed.length > 0 ? trimmed : undefined;
        };

        const payload = {
          fullName: clean(profileForm.fullName),
          email: clean(profileForm.email),
          phone: clean(profileForm.phone),
          address: clean(profileForm.address),
          provinceCity: clean(profileForm.provinceCity),
        };

        const updated = await updateMyProfile(payload);
        const mergedUser = { ...(updated || {}), token };
        localStorage.setItem("user", JSON.stringify(mergedUser));
        setAuth((prev) => ({ ...prev, user: mergedUser }));
        window.dispatchEvent(new Event("auth:changed"));
        toast.success("Cập nhật thông tin thành công");
      } catch (error) {
        const message =
          error?.response?.data?.message || "Cập nhật thông tin thất bại";
        toast.error(message);
      } finally {
        setSaveLoading(false);
      }
    };
    run();
  };

  const onSubmitChangePass = (e) => {
    e.preventDefault();
    toast.info("Chức năng đổi mật khẩu sẽ tích hợp API sau");
  };

  return (
    <div className="bg-gray-50 -mx-4 -mt-4 p-4 md:p-6">
      {/* Breadcrumb */}
      <div className="container mx-auto text-sm text-gray-600 mb-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="hover:text-red-600"
        >
          Trang chủ
        </button>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900 font-semibold">Tài khoản</span>
      </div>

      <div className="container mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Sidebar */}
            <aside className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white">
                    <FiUser size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-gray-600 font-semibold">
                      Tài khoản
                    </div>
                    <div className="text-gray-900 font-bold truncate">
                      {displayName}
                    </div>
                  </div>
                </div>

                <nav className="mt-5 space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = view === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setView(item.key)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-colors ${
                          active
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="text-gray-700" />
                        <span className="flex-1 text-left">{item.label}</span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setOpenLogout(true)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FiLogOut className="text-gray-700" />
                    <span className="flex-1 text-left">Đăng xuất</span>
                  </button>
                </nav>
              </div>
            </aside>

            {/* Content */}
            <section className="lg:col-span-9 p-5 md:p-7">
              {meLoading ? (
                <div className="text-gray-700 text-sm">Đang tải...</div>
              ) : view === "order" ? (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Đơn hàng của tôi
                  </h2>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      Theo dõi trạng thái đơn: Chờ xác nhận → Đang xử lý → Đang
                      giao → Hoàn thành
                    </div>
                    <button
                      type="button"
                      onClick={loadOrders}
                      disabled={ordersLoading}
                      className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-60 font-bold text-gray-800"
                    >
                      {ordersLoading ? "Đang tải..." : "Tải lại"}
                    </button>
                  </div>

                  {ordersLoading ? (
                    <div className="mt-4 text-sm text-gray-700">
                      Đang tải đơn hàng...
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                      <div className="text-gray-700 font-medium">
                        Bạn chưa có đơn hàng nào.
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate("/products")}
                        className="mt-3 text-blue-600 font-bold hover:underline"
                      >
                        Tới trang sản phẩm
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-white">
                      <div className="hidden md:grid grid-cols-[1.2fr_1fr_1fr_1fr_120px] gap-3 px-4 py-3 bg-gray-50 text-xs font-extrabold text-gray-700">
                        <div>Mã đơn / Thời gian</div>
                        <div>Trạng thái</div>
                        <div>Thanh toán</div>
                        <div>Tổng tiền</div>
                        <div></div>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {orders.map((o) => {
                          const orderId = o?._id;
                          const itemCount = Array.isArray(o?.items)
                            ? o.items.reduce(
                                (sum, it) => sum + Number(it?.quantity ?? 0),
                                0,
                              )
                            : 0;
                          return (
                            <div
                              key={orderId}
                              className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_1fr_120px] gap-3 px-4 py-4"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-extrabold text-gray-900 truncate">
                                  {orderId}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {formatDateTime(o?.createdAt)} · {itemCount}{" "}
                                  SP
                                </div>
                              </div>

                              <div>
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border ${badgeClass(
                                    orderStatusKind(o?.orderStatus),
                                  )}`}
                                >
                                  {orderStatusLabel(o?.orderStatus)}
                                </span>
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border ${badgeClass(
                                      paymentStatusKind(o?.paymentStatus),
                                    )}`}
                                  >
                                    {paymentStatusLabel(o?.paymentStatus)}
                                  </span>
                                  <span className="text-xs font-bold text-gray-600">
                                    {o?.paymentMethod}
                                  </span>
                                </div>
                              </div>

                              <div className="text-sm font-extrabold text-gray-900">
                                {formatVnd(o?.finalAmount)}
                              </div>

                              <div className="flex md:justify-end">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(o)}
                                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold"
                                >
                                  Chi tiết
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Modal
                    open={!!selectedOrder}
                    title="Chi tiết đơn hàng"
                    onClose={() => setSelectedOrder(null)}
                  >
                    {selectedOrder ? (
                      <div className="space-y-4">
                        <div className="text-sm">
                          <div className="font-extrabold text-gray-900">
                            Mã đơn: {selectedOrder?._id}
                          </div>
                          <div className="text-gray-600 mt-1">
                            {formatDateTime(selectedOrder?.createdAt)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                            <div className="text-xs text-gray-500 font-bold">
                              Trạng thái
                            </div>
                            <div className="font-extrabold text-gray-900 mt-1">
                              {orderStatusLabel(selectedOrder?.orderStatus)}
                            </div>
                          </div>
                          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                            <div className="text-xs text-gray-500 font-bold">
                              Thanh toán
                            </div>
                            <div className="font-extrabold text-gray-900 mt-1">
                              {paymentStatusLabel(selectedOrder?.paymentStatus)}{" "}
                              ({selectedOrder?.paymentMethod})
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-gray-100 p-3 text-sm">
                          <div className="text-xs text-gray-500 font-bold">
                            Giao hàng
                          </div>
                          <div className="mt-2 space-y-1">
                            <div>
                              <span className="text-gray-600">
                                Người nhận:{" "}
                              </span>
                              <span className="font-bold text-gray-900">
                                {selectedOrder?.fullName}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">SĐT: </span>
                              <span className="font-bold text-gray-900">
                                {selectedOrder?.phoneNumber}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Địa chỉ: </span>
                              <span className="font-bold text-gray-900">
                                {selectedOrder?.shippingAddress}
                              </span>
                            </div>
                            {selectedOrder?.note ? (
                              <div>
                                <span className="text-gray-600">Ghi chú: </span>
                                <span className="font-bold text-gray-900">
                                  {selectedOrder?.note}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="rounded-lg border border-gray-100 overflow-hidden">
                          <div className="bg-gray-50 px-3 py-2 text-xs font-extrabold text-gray-700">
                            Sản phẩm
                          </div>
                          <div className="divide-y divide-gray-100">
                            {(selectedOrder?.items || []).map((it, idx) => (
                              <div
                                key={`${it?.product}-${idx}`}
                                className="px-3 py-3 flex items-start justify-between gap-3 text-sm"
                              >
                                <div className="min-w-0">
                                  <div className="font-extrabold text-gray-900 line-clamp-2">
                                    {it?.productName}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {Number(it?.quantity ?? 0)} ×{" "}
                                    {formatVnd(it?.price)}
                                  </div>
                                </div>
                                <div className="font-extrabold text-gray-900 whitespace-nowrap">
                                  {formatVnd(
                                    Number(it?.quantity ?? 0) *
                                      Number(it?.price ?? 0),
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="text-gray-600">Tổng sản phẩm</div>
                          <div className="font-extrabold text-gray-900">
                            {formatVnd(selectedOrder?.totalAmount)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-gray-600">Phí vận chuyển</div>
                          <div className="font-extrabold text-gray-900">
                            {formatVnd(selectedOrder?.shippingFee)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-base">
                          <div className="font-extrabold text-gray-900">
                            Tổng cộng
                          </div>
                          <div className="font-extrabold text-red-600">
                            {formatVnd(selectedOrder?.finalAmount)}
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(null)}
                            className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-bold text-gray-800"
                          >
                            Đóng
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </Modal>
                </div>
              ) : view === "change-pass" ? (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-5">
                    Thay đổi mật khẩu
                  </h2>

                  <form onSubmit={onSubmitChangePass} className="max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-x-6 gap-y-4">
                      <div className="text-sm font-semibold text-gray-800 md:text-right md:pt-2">
                        Mật khẩu cũ
                      </div>
                      <input
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 outline-none focus:border-red-400 text-sm"
                        placeholder="Nhập mật khẩu cũ"
                        type="password"
                      />

                      <div className="text-sm font-semibold text-gray-800 md:text-right md:pt-2">
                        Mật khẩu mới
                      </div>
                      <input
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 outline-none focus:border-red-400 text-sm"
                        placeholder="Nhập mật khẩu mới"
                        type="password"
                      />

                      <div className="text-sm font-semibold text-gray-800 md:text-right md:pt-2">
                        Nhập lại
                      </div>
                      <input
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 outline-none focus:border-red-400 text-sm"
                        placeholder="Nhập lại mật khẩu mới"
                        type="password"
                      />
                    </div>

                    <div className="mt-7 flex justify-center">
                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-10 py-2.5 rounded-md"
                      >
                        CẬP NHẬT
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-5">
                    Cập nhật thông tin cá nhân
                  </h2>

                  <form onSubmit={onSubmitProfile} className="max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-x-6 gap-y-4">
                      <div className="text-sm font-semibold text-gray-800 md:text-right md:pt-2">
                        Họ tên
                      </div>
                      <input
                        value={profileForm.fullName}
                        onChange={(e) =>
                          setProfileForm((p) => ({
                            ...p,
                            fullName: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 outline-none focus:border-red-400 text-sm"
                      />

                      <div className="text-sm font-semibold text-gray-800 md:text-right md:pt-2">
                        Email
                      </div>
                      <input
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm((p) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 outline-none focus:border-red-400 text-sm"
                      />

                      <div className="text-sm font-semibold text-gray-800 md:text-right md:pt-2">
                        Địa chỉ nhà
                      </div>
                      <input
                        value={profileForm.address}
                        onChange={(e) =>
                          setProfileForm((p) => ({
                            ...p,
                            address: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 outline-none focus:border-red-400 text-sm"
                        placeholder="Nhập địa chỉ"
                      />

                      <div className="text-sm font-semibold text-gray-800 md:text-right md:pt-2">
                        Tỉnh/Thành Phố
                      </div>
                      <select
                        value={profileForm.provinceCity}
                        onChange={(e) =>
                          setProfileForm((p) => ({
                            ...p,
                            provinceCity: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 outline-none focus:border-red-400 text-sm"
                      >
                        <option>Chọn Tỉnh / Thành Phố</option>
                        <option>TP Hồ Chí Minh</option>
                        <option>Hà Nội</option>
                        <option>Đà Nẵng</option>
                      </select>

                      <div className="text-sm font-semibold text-gray-800 md:text-right md:pt-2">
                        Điện thoại cố định
                      </div>
                      <input
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm((p) => ({
                            ...p,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 outline-none focus:border-red-400 text-sm"
                        placeholder="Nhập số điện thoại"
                      />

                      <div className="text-sm font-semibold text-gray-800 md:text-right md:pt-2">
                        Điện thoại di động
                      </div>
                      <input
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm((p) => ({
                            ...p,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 outline-none focus:border-red-400 text-sm"
                        placeholder="Nhập số điện thoại"
                      />
                    </div>

                    <div className="mt-7 flex justify-center">
                      <button
                        type="submit"
                        disabled={saveLoading || meLoading}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-10 py-2.5 rounded-md"
                      >
                        {saveLoading ? "ĐANG LƯU..." : "THAY ĐỔI"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Logout confirm modal */}
      {openLogout && (
        <div className="fixed inset-0 z-[100] bg-black/50 grid place-items-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-gray-100">
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-red-600/10 flex items-center justify-center text-red-600 mb-3">
                  <FiHelpCircle size={28} />
                </div>
                <div className="text-xl font-bold text-gray-900">Xác nhận</div>
                <div className="text-gray-700 font-medium mt-2">
                  Bạn muốn đăng xuất tài khoản?
                </div>

                <div className="mt-6 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenLogout(false);
                      handleLogoutConfirmed();
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-2.5 rounded-md"
                  >
                    Xác nhận
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenLogout(false)}
                    className="bg-gray-700 hover:bg-gray-800 text-white font-bold px-8 py-2.5 rounded-md"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
