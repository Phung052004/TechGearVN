import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import {
  orderService,
  warrantyService,
  reviewService,
  chatService,
} from "../../services";

function StatCard({ title, value, hint, to }) {
  const content = (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="text-sm font-bold text-gray-600">{title}</div>
      <div className="text-3xl font-extrabold text-gray-900 mt-2">{value}</div>
      {hint ? <div className="text-sm text-gray-600 mt-2">{hint}</div> : null}
    </div>
  );

  if (!to) return content;

  return (
    <Link to={to} className="block hover:opacity-95">
      {content}
    </Link>
  );
}

export default function StaffDashboard() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [claims, setClaims] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [rooms, setRooms] = useState([]);

  const counts = useMemo(() => {
    const pendingOrders = orders.filter(
      (o) => o.orderStatus === "PENDING",
    ).length;
    const pendingWarranty = claims.filter((c) => c.status === "PENDING").length;
    const openRooms = rooms.filter((r) => r.status === "OPEN").length;
    const reviewsCount = pendingReviews.length;

    return { pendingOrders, pendingWarranty, openRooms, reviewsCount };
  }, [orders, claims, pendingReviews, rooms]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const [orderRes, claimRes, reviewRes, roomRes] = await Promise.all([
          orderService.getAllOrders(),
          warrantyService.getAllClaims(),
          reviewService.getPendingReviews(),
          chatService.listRooms(),
        ]);

        if (!isMounted) return;
        setOrders(orderRes || []);
        setClaims(claimRes || []);
        setPendingReviews(reviewRes || []);
        setRooms(roomRes || []);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Không tải được dashboard");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Đơn mới chưa xử lý"
          value={loading ? "..." : counts.pendingOrders}
          hint="Cần xác nhận / đóng gói"
          to="/staff/orders"
        />
        <StatCard
          title="Yêu cầu bảo hành mới"
          value={loading ? "..." : counts.pendingWarranty}
          hint="Đang chờ tiếp nhận"
          to="/staff/warranty"
        />
        <StatCard
          title="Đánh giá chờ duyệt"
          value={loading ? "..." : counts.reviewsCount}
          hint="Duyệt / ẩn / phản hồi"
          to="/staff/reviews"
        />
        <StatCard
          title="Phòng chat đang mở"
          value={loading ? "..." : counts.openRooms}
          hint="Hỗ trợ khách hàng"
          to="/staff/chat"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="font-extrabold text-gray-900">Lối tắt</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/staff/orders"
            className="px-3 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm"
          >
            Xử lý đơn
          </Link>
          <Link
            to="/staff/products"
            className="px-3 py-2 rounded-lg border border-gray-200 font-bold text-sm"
          >
            Kho / nhập hàng
          </Link>
          <Link
            to="/staff/chat"
            className="px-3 py-2 rounded-lg border border-gray-200 font-bold text-sm"
          >
            Chat hỗ trợ
          </Link>
        </div>
      </div>
    </div>
  );
}
