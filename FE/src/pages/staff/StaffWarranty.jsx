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
                  filtered.map((c) => (
                    <tr
                      key={c._id}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelected(c)}
                    >
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {String(c._id).slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">
                          {c?.orderItemId || "-"}
                        </div>
                        <div className="text-xs text-gray-600">
                          {c?.user?.fullName || c?.user?.email || ""}
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-1">
                          {c?.reason || ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-extrabold">{c.status}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(c.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="font-extrabold text-gray-900">Cập nhật</div>
          {!selected ? (
            <div className="text-sm text-gray-600 mt-2">Chọn 1 yêu cầu.</div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="text-sm">
                <div className="text-gray-600">Order item id</div>
                <div className="font-extrabold text-gray-900 break-all">
                  {selected.orderItemId}
                </div>
              </div>

              <div className="text-sm">
                <div className="text-gray-600">Serial (nếu có)</div>
                <div className="font-bold text-gray-900 break-all">
                  {selected.productSerialNumber || "-"}
                </div>
              </div>

              <div className="text-sm">
                <div className="text-gray-600">Lý do</div>
                <div className="font-bold text-gray-900 whitespace-pre-wrap mt-1">
                  {selected.reason}
                </div>
              </div>

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

              <div>
                <div className="text-sm font-bold text-gray-700">
                  Resolution
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
                  <option value="REPAIR">REPAIR</option>
                  <option value="REPLACE">REPLACE</option>
                  <option value="REFUND">REFUND</option>
                </select>
              </div>
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
                />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-700">
                  Kết quả xử lý
                </div>
                <textarea
                  rows={3}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  value={selected.resolution || ""}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, resolution: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>
              <button
                type="button"
                className="w-full px-3 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm"
                onClick={saveUpdate}
                disabled={saving}
              >
                Lưu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
