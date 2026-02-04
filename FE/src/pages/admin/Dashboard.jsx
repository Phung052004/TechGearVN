import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { adminService } from "../../services";

function formatVnd(value) {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  } catch {
    return String(value);
  }
}

function Card({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="text-xs font-extrabold text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-extrabold text-gray-900">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const res = await adminService.getAnalyticsOverview();
      setData(res);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không tải được dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const revenue = data?.revenue ?? {};
  const orders = data?.orders ?? {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-extrabold text-gray-900">Dashboard</div>
          <div className="text-sm text-gray-600">Tổng quan nhanh (PAID)</div>
        </div>
        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold"
          onClick={load}
          disabled={loading}
        >
          Tải lại
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card label="Doanh thu hôm nay" value={formatVnd(revenue.today)} />
        <Card label="Đơn hôm nay" value={orders.today ?? 0} />
        <Card label="Đơn tháng này" value={orders.thisMonth ?? 0} />
      </div>

      <div className="text-xs text-gray-500">
        {data?.generatedAt
          ? `Updated: ${new Date(data.generatedAt).toLocaleString("vi-VN")}`
          : ""}
      </div>
    </div>
  );
}
