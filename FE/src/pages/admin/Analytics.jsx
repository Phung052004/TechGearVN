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

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="text-xs font-extrabold text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-extrabold text-gray-900">{value}</div>
    </div>
  );
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const res = await adminService.getAnalyticsOverview();
      setData(res);
      return res;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không tải được analytics");
      setData(null);
      return null;
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
          <div className="text-xl font-extrabold text-gray-900">Analytics</div>
          <div className="text-sm text-gray-600">
            Doanh thu (PAID) • top sản phẩm • cảnh báo tồn kho
          </div>
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
        <StatCard label="Doanh thu hôm nay" value={formatVnd(revenue.today)} />
        <StatCard
          label="Doanh thu tuần này"
          value={formatVnd(revenue.thisWeek)}
        />
        <StatCard
          label="Doanh thu tháng này"
          value={formatVnd(revenue.thisMonth)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Đơn hôm nay" value={orders.today ?? 0} />
        <StatCard label="Đơn tuần này" value={orders.thisWeek ?? 0} />
        <StatCard label="Đơn tháng này" value={orders.thisMonth ?? 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="font-extrabold text-gray-900">
            Top sản phẩm (tháng)
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2 font-extrabold">
                    Sản phẩm
                  </th>
                  <th className="text-right px-3 py-2 font-extrabold">SL</th>
                  <th className="text-right px-3 py-2 font-extrabold">
                    Doanh thu
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-3" colSpan={3}>
                      Đang tải...
                    </td>
                  </tr>
                ) : (data?.topProducts ?? []).length === 0 ? (
                  <tr>
                    <td className="px-3 py-3" colSpan={3}>
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : (
                  (data?.topProducts ?? []).map((p) => (
                    <tr key={p?._id} className="border-t">
                      <td className="px-3 py-2">{p?.productName || p?._id}</td>
                      <td className="px-3 py-2 text-right font-bold">
                        {p?.quantity ?? 0}
                      </td>
                      <td className="px-3 py-2 text-right font-bold">
                        {formatVnd(p?.revenue ?? 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="font-extrabold text-gray-900">Sắp hết hàng</div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2 font-extrabold">
                    Sản phẩm
                  </th>
                  <th className="text-right px-3 py-2 font-extrabold">Tồn</th>
                  <th className="text-right px-3 py-2 font-extrabold">Giá</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-3" colSpan={3}>
                      Đang tải...
                    </td>
                  </tr>
                ) : (data?.lowStockProducts ?? []).length === 0 ? (
                  <tr>
                    <td className="px-3 py-3" colSpan={3}>
                      Không có cảnh báo
                    </td>
                  </tr>
                ) : (
                  (data?.lowStockProducts ?? []).map((p) => (
                    <tr key={p?._id} className="border-t">
                      <td className="px-3 py-2">{p?.name}</td>
                      <td className="px-3 py-2 text-right font-bold">
                        {p?.stockQuantity ?? 0}
                      </td>
                      <td className="px-3 py-2 text-right font-bold">
                        {formatVnd(p?.price ?? 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Generated:{" "}
        {data?.generatedAt
          ? new Date(data.generatedAt).toLocaleString("vi-VN")
          : "-"}
      </div>
    </div>
  );
}
