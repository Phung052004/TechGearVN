import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { warrantyService } from "../../services";

const STATUSES = [
  "PENDING",
  "RECEIVED_PRODUCT",
  "PROCESSING",
  "COMPLETED",
  "REJECTED",
];

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN");
}

export default function StaffWarranty() {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (filter === "ALL") return claims;
    return claims.filter((c) => c.status === filter);
  }, [claims, filter]);

  async function reload() {
    try {
      setLoading(true);
      const res = await warrantyService.getAllClaims();
      setClaims(res || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Không tải được yêu cầu bảo hành",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function saveUpdate() {
    if (!selected) return;
    try {
      setSaving(true);
      await warrantyService.updateClaim(selected._id, {
        status: selected.status,
        staffNote: selected.staffNote,
        resolution: selected.resolution,
      });
      toast.success("Đã cập nhật");
      await reload();
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
            <div className="text-xl font-extrabold text-gray-900">Bảo hành</div>
            <div className="text-sm text-gray-600">
              Tiếp nhận • xử lý • hoàn tất
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-bold"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="ALL">Tất cả</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
                  <th className="text-left px-4 py-3 font-extrabold">
                    Sản phẩm
                  </th>
                  <th className="text-left px-4 py-3 font-extrabold">
                    Trạng thái
                  </th>
                  <th className="text-left px-4 py-3 font-extrabold">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-4" colSpan={4}>
                      Đang tải...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4" colSpan={4}>
                      Không có dữ liệu.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const product = c?.order?.items?.find(
                      (it) =>
                        it?.product === c?.orderItemId ||
                        it?.productName === c?.orderItemId,
                    );
                    return (
                      <tr
                        key={c._id}
                        className="border-t hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelected(c)}
                      >
                        <td className="px-4 py-3 font-bold text-gray-900">
                          {String(c._id).slice(-6).toUpperCase()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900 line-clamp-1">
                            {product?.productName || c?.orderItemId || "-"}
                          </div>
                          <div className="text-xs text-gray-600">
                            {c?.user?.fullName || c?.user?.email || ""}
                          </div>
                          <div className="text-xs text-gray-600 line-clamp-1">
                            {c?.reason}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-extrabold">{c.status}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(c.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 max-h-[80vh] overflow-y-auto">
          <div className="font-extrabold text-gray-900">Chi tiết yêu cầu</div>
          {!selected ? (
            <div className="text-sm text-gray-600 mt-2">Chọn 1 yêu cầu.</div>
          ) : (
            <div className="mt-3 space-y-4">
              {/* Thông tin người dùng */}
              <div className="pb-3 border-b border-gray-200">
                <div className="text-sm font-bold text-gray-700 mb-2">
                  Thông tin khách hàng
                </div>
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-gray-600">Tên:</span>
                    <span className="font-bold text-gray-900">
                      {" "}
                      {selected?.user?.fullName || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="font-bold text-gray-900">
                      {" "}
                      {selected?.user?.email || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Điện thoại:</span>
                    <span className="font-bold text-gray-900">
                      {" "}
                      {selected?.user?.phone || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Địa chỉ:</span>
                    <span className="font-bold text-gray-900">
                      {" "}
                      {selected?.user?.address || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Thông tin sản phẩm */}
              <div className="pb-3 border-b border-gray-200">
                <div className="text-sm font-bold text-gray-700 mb-2">
                  Thông tin sản phẩm
                </div>
                {(() => {
                  const orderId = selected?.order?._id;
                  const product = selected?.order?.items?.find(
                    (it) =>
                      it?.product === selected?.orderItemId ||
                      it?.productName === selected?.orderItemId,
                  );
                  return (
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-gray-600">Tên sản phẩm:</span>
                        <span className="font-bold text-gray-900">
                          {" "}
                          {product?.productName || selected?.orderItemId || "-"}
                        </span>
                      </div>
                      {product ? (
                        <>
                          <div>
                            <span className="text-gray-600">Số lượng:</span>
                            <span className="font-bold text-gray-900">
                              {" "}
                              {product?.quantity || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Giá:</span>
                            <span className="font-bold text-gray-900">
                              {" "}
                              {product?.price?.toLocaleString("vi-VN")} ₫
                            </span>
                          </div>
                        </>
                      ) : null}
                      <div>
                        <span className="text-gray-600">Số seri:</span>
                        <span className="font-bold text-gray-900">
                          {" "}
                          {selected?.productSerialNumber || "-"}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Lý do yêu cầu */}
              <div className="pb-3 border-b border-gray-200">
                <div className="text-xs text-gray-600 font-bold">
                  Lý do yêu cầu
                </div>
                <div className="font-bold text-gray-900 text-xs mt-1">
                  {selected?.reason}
                </div>
                {selected?.description && (
                  <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                    {selected?.description}
                  </div>
                )}
              </div>

              {/* Hình ảnh chứng minh */}
              {selected?.imageProof && selected?.imageProof?.length > 0 && (
                <div className="pb-3 border-b border-gray-200">
                  <div className="text-xs text-gray-600 font-bold mb-2">
                    Hình ảnh chứng minh ({selected?.imageProof?.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected?.imageProof?.map((img, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700"
                      >
                        {typeof img === "string"
                          ? img.split("/").pop()
                          : `Ảnh ${idx + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Thông tin đơn hàng */}
              <div className="pb-3 border-b border-gray-200">
                <div className="text-xs text-gray-600 font-bold">
                  Thông tin đơn hàng
                </div>
                <div className="text-xs space-y-1 mt-1">
                  <div>
                    <span className="text-gray-600">Mã đơn:</span>
                    <span className="font-bold text-gray-900">
                      {" "}
                      {selected?.order?.orderNumber ||
                        String(selected?.order?._id).slice(-6) ||
                        "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Năm đơn:</span>
                    <span className="font-bold text-gray-900">
                      {" "}
                      {selected?.order?.totalAmount?.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Địa chỉ giao:</span>
                    <span className="font-bold text-gray-900">
                      {" "}
                      {selected?.order?.shippingAddress || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trạng thái */}
              <div>
                <div className="text-sm font-bold text-gray-700">
                  Trạng thái
                </div>
                <select
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  value={selected.status}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, status: e.target.value }))
                  }
                  disabled={saving}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resolution */}
              <div>
                <div className="text-sm font-bold text-gray-700">
                  Giải pháp xử lý
                </div>
                <select
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  value={selected.resolution || ""}
                  onChange={(e) =>
                    setSelected((s) => ({
                      ...s,
                      resolution: e.target.value || undefined,
                    }))
                  }
                  disabled={saving}
                >
                  <option value="">-- Chọn --</option>
                  <option value="REPAIR">Sửa chữa</option>
                  <option value="REPLACE">Thay thế</option>
                  <option value="REFUND">Hoàn tiền</option>
                </select>
              </div>

              {/* Ghi chú nhân viên */}
              <div>
                <div className="text-sm font-bold text-gray-700">
                  Ghi chú nhân viên
                </div>
                <textarea
                  rows={3}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  value={selected.staffNote || ""}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, staffNote: e.target.value }))
                  }
                  disabled={saving}
                  placeholder="Nhập ghi chú cho khách hàng..."
                />
              </div>

              {/* Lưu */}
              <button
                type="button"
                className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
                onClick={saveUpdate}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
