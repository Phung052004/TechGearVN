import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { orderService } from "../../services";
import { useAuth } from "../../context";

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
    DELIVERY_FAILED: "bg-orange-50 text-orange-700 border-orange-100",
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
  "DELIVERY_FAILED",
  "CANCELLED",
  "RETURNED",
];
const PAYMENT_STATUSES = ["UNPAID", "PAID"];

export default function StaffOrders() {
  const { user } = useAuth();
  const isDelivery = user?.role === "DELIVERY";

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // New state for delivery reassignment
  const [deliveryPeople, setDeliveryPeople] = useState([]);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState(null);
  const [reassigning, setReassigning] = useState(false);

  // State for delivery failure reporting
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [reportingFailure, setReportingFailure] = useState(false);

  // State for assigning delivery person to order
  const [assigningDelivery, setAssigningDelivery] = useState(false);
  const [selectedDeliveryForAssignment, setSelectedDeliveryForAssignment] =
    useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const id = String(o?._id || "").toLowerCase();
      const name = String(o?.fullName || "").toLowerCase();
      const phone = String(o?.phoneNumber || "").toLowerCase();
      return id.includes(q) || name.includes(q) || phone.includes(q);
    });
  }, [orders, query]);

  // Reset page when query changes
  useEffect(() => {
    setPage(1);
  }, [query]);

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
    // Load delivery people for reassignment
    loadDeliveryPeople();
  }, []);

  async function updateStatus(orderId, orderStatus, paymentStatus) {
    try {
      setSaving(true);
      const payload = isDelivery
        ? { orderStatus }
        : { orderStatus, paymentStatus };

      await orderService.updateOrderStatus(orderId, payload);
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

  async function claim(orderId) {
    try {
      setSaving(true);
      await orderService.claimOrder(orderId);
      toast.success("Đã nhận đơn");
      const list = await reload();
      const updated = (list || []).find((o) => o._id === orderId);
      setSelected(updated || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Nhận đơn thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function loadDeliveryPeople() {
    try {
      const data = await orderService.getDeliveryPeople();
      setDeliveryPeople(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải danh sách người giao hàng", err);
    }
  }

  async function reassignDelivery(orderId, newDeliveryPersonId, failureReason) {
    try {
      setReassigning(true);
      // First, mark as DELIVERY_FAILED with failure reason
      await orderService.updateOrderStatus(orderId, {
        orderStatus: "DELIVERY_FAILED",
        failureReason: failureReason,
      });
      // Then, reassign to new person by changing status back to PROCESSING
      // The backend will handle clearing the old assignee
      await orderService.updateOrderStatus(orderId, {
        orderStatus: "PROCESSING",
        deliveryAssignee: newDeliveryPersonId,
      });
      toast.success("Đã gán lại người giao hàng");
      setShowReassignModal(false);
      setSelectedDeliveryPerson(null);
      const list = await reload();
      const updated = (list || []).find((o) => o._id === orderId);
      setSelected(updated || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gán lại thất bại");
    } finally {
      setReassigning(false);
    }
  }

  async function markDelivered(orderId) {
    await updateStatus(orderId, "COMPLETED", selected?.paymentStatus);
  }

  async function markDeliveryFailed() {
    if (!selected || !failureReason.trim()) {
      toast.error("Vui lòng chọn lý do giao hàng thất bại");
      return;
    }
    let reason = failureReason;
    if (reason === "Khác") {
      reason = document.getElementById("otherFailureReason")?.value || "Khác";
      if (!reason.trim()) {
        toast.error("Vui lòng nhập lý do khác");
        return;
      }
    }
    try {
      setReportingFailure(true);
      await orderService.updateOrderStatus(selected._id, {
        orderStatus: "DELIVERY_FAILED",
        failureReason: reason.trim(),
      });
      toast.success("Đã báo cáo giao hàng thất bại");
      setShowFailureModal(false);
      setFailureReason("");
      const list = await reload();
      const updated = (list || []).find((o) => o._id === selected._id);
      setSelected(updated || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Báo cáo thất bại");
    } finally {
      setReportingFailure(false);
    }
  }

  async function assignDeliveryPerson(deliveryPersonId) {
    if (!selected || !deliveryPersonId) {
      toast.error("Vui lòng chọn người giao hàng");
      return;
    }
    try {
      setAssigningDelivery(true);
      await orderService.updateOrderStatus(selected._id, {
        deliveryAssignee: deliveryPersonId,
      });
      toast.success("Đã gán người giao hàng");
      setSelectedDeliveryForAssignment(null);
      const list = await reload();
      const updated = (list || []).find((o) => o._id === selected._id);
      setSelected(updated || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gán thất bại");
    } finally {
      setAssigningDelivery(false);
    }
  }

  async function handoffToDelivery(orderId) {
    await updateStatus(orderId, "SHIPPING", selected?.paymentStatus);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold text-gray-900">Đơn hàng</div>
            <div className="text-sm text-gray-600">
              {isDelivery
                ? "Nhận đơn • giao hàng • hoàn tất"
                : "Xác nhận • đóng gói • giao hàng • hoàn tất"}
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
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
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
                  (() => {
                    const totalPages = Math.max(
                      1,
                      Math.ceil(filtered.length / pageSize),
                    );
                    const pageItems = filtered.slice(
                      (page - 1) * pageSize,
                      page * pageSize,
                    );
                    return pageItems.map((o) => (
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
                    ));
                  })()
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > pageSize && (
            <div className="p-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Tổng {filtered.length} đơn
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded border text-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </button>
                <span className="text-sm">
                  {page} / {Math.max(1, Math.ceil(filtered.length / pageSize))}
                </span>
                <button
                  className="px-3 py-1 rounded border text-sm"
                  onClick={() =>
                    setPage((p) =>
                      Math.min(Math.ceil(filtered.length / pageSize), p + 1),
                    )
                  }
                  disabled={page * pageSize >= filtered.length}
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
                    disabled={saving || isDelivery}
                  >
                    {(isDelivery
                      ? ["SHIPPING", "COMPLETED"]
                      : ORDER_STATUSES
                    ).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {isDelivery && (
                    <div className="text-xs text-gray-500 mt-1">
                      Delivery cập nhật bằng nút thao tác.
                    </div>
                  )}
                </div>
                {!isDelivery && (
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
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {!isDelivery &&
                  selected?.orderStatus === "PROCESSING" &&
                  selected?.deliveryAssignee && (
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg bg-purple-600 text-white font-bold text-sm"
                      onClick={() => handoffToDelivery(selected._id)}
                      disabled={saving}
                    >
                      Bàn giao giao hàng
                    </button>
                  )}

                {!isDelivery && selected?.orderStatus === "DELIVERY_FAILED" && (
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg bg-orange-600 text-white font-bold text-sm"
                    onClick={() => setShowReassignModal(true)}
                    disabled={reassigning}
                  >
                    Gán lại giao hàng
                  </button>
                )}

                {isDelivery && !selected?.deliveryAssignee && (
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white font-bold text-sm"
                    onClick={() => claim(selected._id)}
                    disabled={saving}
                  >
                    Nhận đơn
                  </button>
                )}

                {isDelivery && selected?.deliveryAssignee && (
                  <>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg bg-purple-600 text-white font-bold text-sm"
                      onClick={() => markDelivered(selected._id)}
                      disabled={saving || selected?.orderStatus === "COMPLETED"}
                    >
                      Hoàn tất giao
                    </button>
                    {selected?.orderStatus !== "COMPLETED" && (
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg bg-rose-600 text-white font-bold text-sm"
                        onClick={() => setShowFailureModal(true)}
                        disabled={reportingFailure}
                      >
                        Giao hàng thất bại
                      </button>
                    )}
                  </>
                )}

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
                  disabled={saving || isDelivery}
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
                {!isDelivery && (
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
                )}
              </div>

              <div className="border-t pt-3">
                <div className="text-sm font-extrabold text-gray-900">
                  Giao hàng
                </div>

                {/* Assign delivery person if PROCESSING and no assignee yet */}
                {!isDelivery &&
                  selected?.orderStatus === "PROCESSING" &&
                  !selected?.deliveryAssignee && (
                    <div className="mt-3 space-y-2">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Chọn người giao hàng:
                        </label>
                        <select
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                          value={selectedDeliveryForAssignment?._id || ""}
                          onChange={(e) => {
                            const person = deliveryPeople.find(
                              (p) => p._id === e.target.value,
                            );
                            setSelectedDeliveryForAssignment(person || null);
                          }}
                        >
                          <option value="">-- Chọn người --</option>
                          {deliveryPeople.map((person) => (
                            <option key={person._id} value={person._id}>
                              {person.fullName} ({person.successRate}%)
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedDeliveryForAssignment && (
                        <button
                          type="button"
                          className="w-full px-3 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm"
                          onClick={() =>
                            assignDeliveryPerson(
                              selectedDeliveryForAssignment._id,
                            )
                          }
                          disabled={assigningDelivery}
                        >
                          {assigningDelivery
                            ? "Đang gán..."
                            : "Gán người giao hàng"}
                        </button>
                      )}
                    </div>
                  )}

                {/* Show delivery person info if already assigned */}
                {(selected?.deliveryAssignee ||
                  selected?.orderStatus !== "PROCESSING") && (
                  <div className="text-sm text-gray-700 mt-2 space-y-1">
                    <div>
                      <span className="font-bold">Người nhận giao:</span>{" "}
                      {selected?.deliveryAssignee?.fullName ||
                        selected?.deliveryAssignee?.email ||
                        "-"}
                    </div>
                    <div>
                      <span className="font-bold">Nhận lúc:</span>{" "}
                      {formatDate(selected?.deliveryClaimedAt)}
                    </div>
                    <div>
                      <span className="font-bold">Hoàn tất lúc:</span>{" "}
                      {formatDate(selected?.deliveredAt)}
                    </div>
                  </div>
                )}
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

      {/* Reassignment Modal */}
      {showReassignModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <div className="text-lg font-extrabold text-gray-900 mb-4">
              Gán lại giao hàng
            </div>

            {/* Current failure reason */}
            {selected?.note && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                <div className="text-sm font-bold text-orange-900 mb-1">
                  Lý do thất bại:
                </div>
                <div className="text-sm text-orange-800">{selected.note}</div>
              </div>
            )}

            {/* Delivery person selector */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Chọn người giao hàng mới:
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                value={selectedDeliveryPerson?._id || ""}
                onChange={(e) => {
                  const person = deliveryPeople.find(
                    (p) => p._id === e.target.value,
                  );
                  setSelectedDeliveryPerson(person || null);
                }}
              >
                <option value="">-- Chọn người --</option>
                {deliveryPeople.map((person) => (
                  <option key={person._id} value={person._id}>
                    {person.fullName} ({person.successRate}% -{" "}
                    {person.completedCount}/{person.assignedCount})
                  </option>
                ))}
              </select>
            </div>

            {/* Show selected person's stats */}
            {selectedDeliveryPerson && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="text-sm font-bold text-blue-900 mb-2">
                  {selectedDeliveryPerson.fullName}
                </div>
                <div className="text-xs text-blue-800 space-y-1">
                  <div>
                    Tỷ lệ thành công: {selectedDeliveryPerson.successRate}%
                  </div>
                  <div>
                    Giao thành công: {selectedDeliveryPerson.completedCount}
                  </div>
                  <div>
                    Giao thất bại: {selectedDeliveryPerson.failureCount}
                  </div>
                  <div>
                    Tổng đơn hoàn tất: {selectedDeliveryPerson.assignedCount}
                  </div>
                </div>
              </div>
            )}

            {/* Failure reason input */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Lý do gán lại (tuỳ chọn):
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                rows="3"
                placeholder="Nhập lý do gán lại..."
                defaultValue={selected?.note || ""}
                id="reassignReason"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-200 font-bold text-sm"
                onClick={() => {
                  setShowReassignModal(false);
                  setSelectedDeliveryPerson(null);
                }}
                disabled={reassigning}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm"
                onClick={() => {
                  if (!selectedDeliveryPerson) {
                    toast.error("Vui lòng chọn người giao hàng");
                    return;
                  }
                  const reason =
                    document.getElementById("reassignReason").value;
                  reassignDelivery(
                    selected._id,
                    selectedDeliveryPerson._id,
                    reason,
                  );
                }}
                disabled={reassigning || !selectedDeliveryPerson}
              >
                {reassigning ? "Đang gán..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Failure Modal */}
      {showFailureModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <div className="text-lg font-extrabold text-gray-900 mb-4">
              Báo cáo giao hàng thất bại
            </div>

            {/* Current order info */}
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm font-bold text-gray-900 mb-1">
                Mã đơn:
              </div>
              <div className="text-sm text-gray-700 break-all">
                {selected._id}
              </div>
              <div className="text-sm font-bold text-gray-900 mt-2 mb-1">
                Khách hàng:
              </div>
              <div className="text-sm text-gray-700">{selected?.fullName}</div>
              <div className="text-sm font-bold text-gray-900 mt-2 mb-1">
                Địa chỉ:
              </div>
              <div className="text-sm text-gray-700">
                {selected?.shippingAddress}
              </div>
            </div>

            {/* Failure reason input */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Lý do giao hàng thất bại <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-2"
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
              >
                <option value="">-- Chọn lý do --</option>
                <option value="Khách hàng không có mặt">
                  Khách hàng không có mặt
                </option>
                <option value="Điện thoại khách không liên lạc được">
                  Điện thoại khách không liên lạc được
                </option>
                <option value="Địa chỉ không tìm thấy">
                  Địa chỉ không tìm thấy
                </option>
                <option value="Khách hàng từ chối nhận hàng">
                  Khách hàng từ chối nhận hàng
                </option>
                <option value="Địa chỉ không đúng">Địa chỉ không đúng</option>
                <option value="Sai số điện thoại">Sai số điện thoại</option>
                <option value="Khách hàng yêu cầu giao lại">
                  Khách hàng yêu cầu giao lại
                </option>
                <option value="Khác">Khác</option>
              </select>
              {failureReason === "Khác" && (
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  rows="3"
                  placeholder="Nhập lý do khác..."
                  id="otherFailureReason"
                />
              )}
            </div>

            {/* Confirmation text */}
            <div className="mb-4 p-3 bg-orange-50 border border-orange-100 rounded-lg">
              <div className="text-sm text-orange-900">
                ⚠️ Báo cáo thất bại sẽ chuyển đơn hàng về trạng thái{" "}
                <span className="font-bold">DELIVERY_FAILED</span>. Trưởng nhóm
                sẽ xem xét và gán lại cho người khác.
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-200 font-bold text-sm"
                onClick={() => {
                  setShowFailureModal(false);
                  setFailureReason("");
                }}
                disabled={reportingFailure}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-bold text-sm"
                onClick={() => {
                  let reason = failureReason;
                  if (reason === "Khác") {
                    reason =
                      document.getElementById("otherFailureReason").value ||
                      "Khác";
                  }
                  if (!reason) {
                    toast.error("Vui lòng chọn lý do");
                    return;
                  }
                  markDeliveryFailed();
                }}
                disabled={reportingFailure || !failureReason}
              >
                {reportingFailure ? "Đang báo cáo..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
