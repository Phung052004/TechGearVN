import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { orderService } from "../../services";

function formatMoney(value) {
  if (value == null) return "-";
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return String(value);
  }
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN");
}

function StatusPill({ value }) {
  const map = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-100",
    PROCESSING: "bg-blue-50 text-blue-700 border-blue-100",
    SHIPPING: "bg-purple-50 text-purple-700 border-purple-100",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-100",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-100",
    RETURNED: "bg-gray-50 text-gray-700 border-gray-100",
  };
  const cls = map[value] || "bg-gray-50 text-gray-700 border-gray-100";
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-extrabold rounded-full border ${cls}`}
    >
      {value}
    </span>
  );
}

function PaymentPill({ value }) {
  const map = {
    UNPAID: "bg-amber-50 text-amber-700 border-amber-100",
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };
  const cls = map[value] || "bg-gray-50 text-gray-700 border-gray-100";
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-extrabold rounded-full border ${cls}`}
    >
      {value}
    </span>
  );
}

function printOrder(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Đơn hàng ${order?._id || ""}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; }
        h1 { font-size: 20px; margin: 0 0 8px; }
        .meta { color: #555; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
        th { background: #f5f5f5; text-align: left; }
        .right { text-align: right; }
      </style>
    </head>
    <body>
      <h1>Phiếu đơn hàng</h1>
      <div class="meta">
        <div><b>Mã đơn:</b> ${order?._id || "-"}</div>
        <div><b>Ngày tạo:</b> ${formatDate(order?.createdAt)}</div>
        <div><b>Trạng thái:</b> ${order?.orderStatus || "-"}</div>
        <div><b>Thanh toán:</b> ${order?.paymentStatus || "-"} (${order?.paymentMethod || "-"})</div>
      </div>

      <div class="meta">
        <div><b>Người nhận:</b> ${order?.fullName || "-"}</div>
        <div><b>SĐT:</b> ${order?.phoneNumber || "-"}</div>
        <div><b>Địa chỉ:</b> ${order?.shippingAddress || "-"}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th class="right">SL</th>
            <th class="right">Giá</th>
            <th class="right">Tạm tính</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map((it) => {
              const name = it?.productName || "-";
              const qty = Number(it?.quantity || 0);
              const price = Number(it?.price || 0);
              return `<tr>
                <td>${name}</td>
                <td class="right">${qty}</td>
                <td class="right">${formatMoney(price)}</td>
                <td class="right">${formatMoney(qty * price)}</td>
              </tr>`;
            })
            .join("\n")}
        </tbody>
      </table>

      <div style="margin-top: 12px; text-align: right;">
        <div><b>Tạm tính:</b> ${formatMoney(order?.totalAmount)}</div>
        <div><b>Phí ship:</b> ${formatMoney(order?.shippingFee)}</div>
        <div style="font-weight: 800;"><b>Thành tiền:</b> ${formatMoney(order?.finalAmount)}</div>
      </div>

      <script>window.onload = () => window.print();</script>
    </body>
  </html>`;

  const w = window.open(
    "",
    "_blank",
    "noopener,noreferrer,width=900,height=700",
  );
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
  "RETURNED",
];
const PAYMENT_STATUSES = ["UNPAID", "PAID"];

export default function StaffOrders() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const id = String(o?._id || "").toLowerCase();
      const name = String(o?.shippingAddress?.fullName || "").toLowerCase();
      const phone = String(o?.shippingAddress?.phone || "").toLowerCase();
      return id.includes(q) || name.includes(q) || phone.includes(q);
    });
  }, [orders, query]);

  async function reload() {
    try {
      setLoading(true);
      const res = await orderService.getAllOrders();
      const list = res || [];
      setOrders(list);
      return list;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không tải được đơn hàng");
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function updateStatus(orderId, orderStatus, paymentStatus) {
    try {
      setSaving(true);
      await orderService.updateOrderStatus(orderId, {
        orderStatus,
        paymentStatus,
      });
      toast.success("Đã cập nhật trạng thái");
      const list = await reload();
      const updated = (list || []).find((o) => o._id === orderId);
      setSelected(updated || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold text-gray-900">Đơn hàng</div>
            <div className="text-sm text-gray-600">
              Xác nhận • đóng gói • giao hàng • hoàn tất
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo mã đơn / tên / SĐT"
              className="w-full md:w-[320px] px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold"
              onClick={reload}
              disabled={loading}
            >
              Tải lại
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-extrabold">Mã</th>
                  <th className="text-left px-4 py-3 font-extrabold">Khách</th>
                  <th className="text-left px-4 py-3 font-extrabold">
                    Trạng thái
                  </th>
                  <th className="text-left px-4 py-3 font-extrabold">
                    Thanh toán
                  </th>
                  <th className="text-right px-4 py-3 font-extrabold">Tổng</th>
                  <th className="text-left px-4 py-3 font-extrabold">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-4" colSpan={6}>
                      Đang tải...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4" colSpan={6}>
                      Không có đơn nào.
                    </td>
                  </tr>
                ) : (
                  filtered.map((o) => (
                    <tr
                      key={o._id}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelected(o)}
                    >
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {String(o._id).slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">
                          {o?.fullName || "-"}
                        </div>
                        <div className="text-xs text-gray-600">
                          {o?.phoneNumber || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill value={o.orderStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <PaymentPill value={o.paymentStatus} />
                          <span className="text-xs text-gray-600">
                            {o.paymentMethod}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold">
                        {formatMoney(o.finalAmount)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(o.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="font-extrabold text-gray-900">Chi tiết</div>

          {!selected ? (
            <div className="text-sm text-gray-600 mt-2">
              Chọn một đơn để xem và cập nhật.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="text-sm">
                <div className="text-gray-600">Mã đơn</div>
                <div className="font-extrabold text-gray-900 break-all">
                  {selected._id}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-gray-600 text-sm">Trạng thái</div>
                  <select
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    value={selected.orderStatus}
                    onChange={(e) =>
                      setSelected((s) => ({
                        ...s,
                        orderStatus: e.target.value,
                      }))
                    }
                    disabled={saving}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-gray-600 text-sm">Thanh toán</div>
                  <select
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    value={selected.paymentStatus}
                    onChange={(e) =>
                      setSelected((s) => ({
                        ...s,
                        paymentStatus: e.target.value,
                      }))
                    }
                    disabled={saving}
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm"
                  onClick={() =>
                    updateStatus(
                      selected._id,
                      selected.orderStatus,
                      selected.paymentStatus,
                    )
                  }
                  disabled={saving}
                >
                  Lưu
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border border-gray-200 font-bold text-sm"
                  onClick={() => printOrder(selected)}
                >
                  In phiếu
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border border-rose-200 text-rose-700 font-bold text-sm"
                  onClick={() =>
                    updateStatus(
                      selected._id,
                      "CANCELLED",
                      selected.paymentStatus,
                    )
                  }
                  disabled={saving}
                >
                  Hủy đơn
                </button>
              </div>

              <div className="border-t pt-3">
                <div className="text-sm font-extrabold text-gray-900">
                  Thông tin giao hàng
                </div>
                <div className="text-sm text-gray-700 mt-2 space-y-1">
                  <div>
                    <span className="font-bold">Tên:</span>{" "}
                    {selected?.fullName || "-"}
                  </div>
                  <div>
                    <span className="font-bold">SĐT:</span>{" "}
                    {selected?.phoneNumber || "-"}
                  </div>
                  <div>
                    <span className="font-bold">Địa chỉ:</span>{" "}
                    {selected?.shippingAddress || "-"}
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="text-sm font-extrabold text-gray-900">
                  Sản phẩm
                </div>
                <div className="mt-2 space-y-2">
                  {(selected?.items || []).map((it, idx) => (
                    <div
                      key={`${selected._id}-${idx}`}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 line-clamp-1">
                          {it?.productName || "-"}
                        </div>
                        <div className="text-xs text-gray-600">
                          SL: {it?.quantity} • {formatMoney(it?.price)}
                        </div>
                      </div>
                      <div className="font-extrabold text-gray-900">
                        {formatMoney((it?.quantity || 0) * (it?.price || 0))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
