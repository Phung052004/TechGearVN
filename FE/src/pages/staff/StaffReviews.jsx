import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { reviewService } from "../../services";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN");
}

export default function StaffReviews() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  async function reload() {
    try {
      setLoading(true);
      const res = await reviewService.getPendingReviews();
      setReviews(res || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không tải được đánh giá");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function moderate(status) {
    if (!selected) return;
    try {
      setSaving(true);
      await reviewService.moderateReview(selected._id, {
        status,
        reply: selected.reply || "",
      });
      toast.success("Đã cập nhật");
      setSelected(null);
      await reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold text-gray-900">Đánh giá</div>
            <div className="text-sm text-gray-600">Duyệt và phản hồi</div>
          </div>
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-extrabold">
                    Sản phẩm
                  </th>
                  <th className="text-left px-4 py-3 font-extrabold">Khách</th>
                  <th className="text-left px-4 py-3 font-extrabold">Sao</th>
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
                ) : reviews.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4" colSpan={4}>
                      Không có đánh giá chờ duyệt.
                    </td>
                  </tr>
                ) : (
                  reviews.map((r) => (
                    <tr
                      key={r._id}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelected(r)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">
                          {r?.product?.name || "-"}
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-1">
                          {r?.comment || ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r?.user?.fullName || r?.user?.email || "-"}
                      </td>
                      <td className="px-4 py-3 font-extrabold">{r?.rating}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(r?.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="font-extrabold text-gray-900">Duyệt</div>
          {!selected ? (
            <div className="text-sm text-gray-600 mt-2">Chọn 1 đánh giá.</div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="text-sm">
                <div className="text-gray-600">Nội dung</div>
                <div className="font-bold text-gray-900 mt-1">
                  {selected.comment || "(Không có)"}
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-gray-700">Phản hồi</div>
                <textarea
                  rows={4}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  value={selected.reply || ""}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, reply: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 text-white font-bold text-sm"
                  onClick={() => moderate("APPROVED")}
                  disabled={saving}
                >
                  Duyệt
                </button>
                <button
                  type="button"
                  className="flex-1 px-3 py-2 rounded-lg border border-rose-200 text-rose-700 font-bold text-sm"
                  onClick={() => moderate("HIDDEN")}
                  disabled={saving}
                >
                  Ẩn
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
