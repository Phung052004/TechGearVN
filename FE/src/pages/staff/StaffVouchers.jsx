import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { voucherService } from "../../services";

function randomCode(prefix = "TECHGEAR") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${out}`;
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN");
}

export default function StaffVouchers() {
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState([]);
  const [activeOnly, setActiveOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [selectedId, setSelectedId] = useState("");
  const selectedVoucher = useMemo(() => {
    if (!selectedId) return null;
    return vouchers.find((v) => v._id === selectedId) || null;
  }, [vouchers, selectedId]);

  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENT",
    discountValue: "",
    minOrderValue: "",
    maxDiscountAmount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
    status: "ACTIVE",
  });

  const [edit, setEdit] = useState({
    discountType: "PERCENT",
    discountValue: "",
    minOrderValue: "",
    maxDiscountAmount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
    status: "ACTIVE",
  });

  const filtered = useMemo(() => {
    const list = Array.isArray(vouchers) ? vouchers : [];
    if (!activeOnly) return list;
    return list.filter((v) => v.status === "ACTIVE");
  }, [vouchers, activeOnly]);

  useEffect(() => {
    setPage(1);
  }, [activeOnly, vouchers.length]);

  async function reload() {
    try {
      setLoading(true);
      const list = await voucherService.getVouchers();
      setVouchers(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không tải được vouchers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    if (!selectedVoucher) return;
    const toLocalDatetime = (value) => {
      if (!value) return "";
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "";
      // datetime-local expects "YYYY-MM-DDTHH:mm"
      const pad = (n) => String(n).padStart(2, "0");
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mi = pad(d.getMinutes());
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    };

    setEdit({
      discountType: selectedVoucher.discountType || "PERCENT",
      discountValue: selectedVoucher.discountValue ?? "",
      minOrderValue: selectedVoucher.minOrderValue ?? "",
      maxDiscountAmount: selectedVoucher.maxDiscountAmount ?? "",
      usageLimit: selectedVoucher.usageLimit ?? "",
      startDate: toLocalDatetime(selectedVoucher.startDate),
      endDate: toLocalDatetime(selectedVoucher.endDate),
      status: selectedVoucher.status || "ACTIVE",
    });
  }, [selectedVoucher]);

  async function onCreate() {
    try {
      const code = String(form.code || "")
        .trim()
        .toUpperCase();
      if (!code) {
        toast.error("Nhập mã voucher");
        return;
      }

      const discountValue = Number(form.discountValue || 0);
      if (!Number.isFinite(discountValue) || discountValue <= 0) {
        toast.error("Nhập giá trị giảm hợp lệ");
        return;
      }

      if (form.discountType === "PERCENT" && discountValue > 100) {
        toast.error("Giảm theo % phải <= 100");
        return;
      }

      const payload = {
        code,
        discountType: form.discountType,
        discountValue,
        status: form.status,
      };

      const minOrderValue = Number(form.minOrderValue || 0);
      if (Number.isFinite(minOrderValue) && minOrderValue > 0) {
        payload.minOrderValue = minOrderValue;
      }

      const maxDiscountAmount = Number(form.maxDiscountAmount || 0);
      if (Number.isFinite(maxDiscountAmount) && maxDiscountAmount > 0) {
        payload.maxDiscountAmount = maxDiscountAmount;
      }

      const usageLimit = Number(form.usageLimit || 0);
      if (Number.isFinite(usageLimit) && usageLimit > 0) {
        payload.usageLimit = usageLimit;
      }

      if (form.startDate)
        payload.startDate = new Date(form.startDate).toISOString();
      if (form.endDate) payload.endDate = new Date(form.endDate).toISOString();

      await voucherService.createVoucher(payload);
      toast.success("Đã tạo voucher");
      setForm((s) => ({
        ...s,
        code: "",
        discountValue: "",
        minOrderValue: "",
        maxDiscountAmount: "",
        usageLimit: "",
        startDate: "",
        endDate: "",
      }));
      await reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Tạo voucher thất bại");
    }
  }

  async function onDelete(voucherId) {
    const ok = window.confirm("Xóa voucher này?");
    if (!ok) return;

    try {
      await voucherService.deleteVoucher(voucherId);
      toast.success("Đã xóa voucher");
      await reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Xóa voucher thất bại");
    }
  }

  async function onToggleStatus(v) {
    try {
      const nextStatus = v.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await voucherService.updateVoucher(v._id, { status: nextStatus });
      toast.success(`Đã chuyển trạng thái: ${nextStatus}`);
      await reload();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Cập nhật trạng thái thất bại",
      );
    }
  }

  async function onUpdate() {
    if (!selectedVoucher?._id) return;

    try {
      const discountValue = Number(edit.discountValue || 0);
      if (!Number.isFinite(discountValue) || discountValue <= 0) {
        toast.error("Nhập giá trị giảm hợp lệ");
        return;
      }
      if (edit.discountType === "PERCENT" && discountValue > 100) {
        toast.error("Giảm theo % phải <= 100");
        return;
      }

      const payload = {
        discountType: edit.discountType,
        discountValue,
        status: edit.status,
      };

      const minOrderValue = Number(edit.minOrderValue || 0);
      if (Number.isFinite(minOrderValue) && minOrderValue >= 0) {
        payload.minOrderValue = minOrderValue;
      }

      const maxDiscountAmount =
        edit.maxDiscountAmount === "" ? null : Number(edit.maxDiscountAmount);
      if (maxDiscountAmount === null) {
        payload.maxDiscountAmount = null;
      } else if (Number.isFinite(maxDiscountAmount) && maxDiscountAmount >= 0) {
        payload.maxDiscountAmount = maxDiscountAmount;
      }

      const usageLimit =
        edit.usageLimit === "" ? null : Number(edit.usageLimit);
      if (usageLimit === null) {
        payload.usageLimit = null;
      } else if (Number.isFinite(usageLimit) && usageLimit >= 0) {
        payload.usageLimit = usageLimit;
      }

      payload.startDate = edit.startDate
        ? new Date(edit.startDate).toISOString()
        : null;
      payload.endDate = edit.endDate
        ? new Date(edit.endDate).toISOString()
        : null;

      await voucherService.updateVoucher(selectedVoucher._id, payload);
      toast.success("Đã cập nhật voucher");
      await reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cập nhật voucher thất bại");
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold text-gray-900">Voucher</div>
            <div className="text-sm text-gray-600">
              Tạo mã • Xem danh sách • Sửa / bật tắt • Xóa
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            Chỉ ACTIVE
          </label>
        </div>

        <div className="mt-4 overflow-auto border border-gray-100 rounded-xl max-h-[60vh]">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-extrabold text-gray-700">
                  Code
                </th>
                <th className="px-3 py-2 text-left font-extrabold text-gray-700">
                  Loại
                </th>
                <th className="px-3 py-2 text-right font-extrabold text-gray-700">
                  Giá trị
                </th>
                <th className="px-3 py-2 text-left font-extrabold text-gray-700">
                  Trạng thái
                </th>
                <th className="px-3 py-2 text-right font-extrabold text-gray-700">
                  Đã dùng
                </th>
                <th className="px-3 py-2 text-left font-extrabold text-gray-700">
                  Hiệu lực
                </th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-3 text-gray-600" colSpan={7}>
                    Đang tải...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-gray-600" colSpan={7}>
                    Chưa có voucher.
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
                  return pageItems.map((v) => (
                    <tr
                      key={v._id}
                      className={
                        "border-t border-gray-100 cursor-pointer " +
                        (selectedId === v._id
                          ? "bg-blue-50"
                          : "hover:bg-gray-50")
                      }
                      onClick={() => setSelectedId(v._id)}
                      title="Bấm để chỉnh sửa"
                    >
                      <td className="px-3 py-3 font-extrabold text-gray-900">
                        {v.code}
                      </td>
                      <td className="px-3 py-3 font-bold text-gray-700">
                        {v.discountType}
                      </td>
                      <td className="px-3 py-3 text-right font-extrabold">
                        {v.discountType === "PERCENT"
                          ? `${v.discountValue}%`
                          : v.discountValue}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={
                            v.status === "INACTIVE"
                              ? "text-rose-700 font-extrabold"
                              : "text-emerald-700 font-extrabold"
                          }
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-gray-700">
                        {v.usedCount ?? 0}
                        {v.usageLimit ? ` / ${v.usageLimit}` : ""}
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        <div className="text-xs">
                          Start: {formatDate(v.startDate)}
                        </div>
                        <div className="text-xs">
                          End: {formatDate(v.endDate)}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          className={
                            v.status === "ACTIVE"
                              ? "px-3 py-2 rounded-lg border border-amber-200 text-amber-800 font-bold text-xs mr-2"
                              : "px-3 py-2 rounded-lg border border-emerald-200 text-emerald-800 font-bold text-xs mr-2"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStatus(v);
                          }}
                        >
                          {v.status === "ACTIVE" ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg border border-rose-200 text-rose-700 font-bold text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(v._id);
                          }}
                        >
                          Xóa
                        </button>
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
              Tổng {filtered.length} voucher
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

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-5">
        <div>
          <div className="font-extrabold text-gray-900">Tạo voucher</div>
          <div className="text-sm text-gray-600">
            Nhân viên có thể tạo mã, sửa, bật/tắt và xóa.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
              placeholder="Mã voucher (VD: TECHGEAR-ABC12345)"
              value={form.code}
              onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
            />
            <button
              type="button"
              className="px-3 py-2 rounded-lg border border-gray-200 font-bold text-sm"
              onClick={() => setForm((s) => ({ ...s, code: randomCode() }))}
              title="Tạo mã ngẫu nhiên"
            >
              Tạo mã
            </button>
          </div>

          <select
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            value={form.discountType}
            onChange={(e) =>
              setForm((s) => ({ ...s, discountType: e.target.value }))
            }
          >
            <option value="PERCENT">PERCENT</option>
            <option value="FIXED_AMOUNT">FIXED_AMOUNT</option>
          </select>

          <input
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            placeholder={
              form.discountType === "PERCENT"
                ? "Giá trị giảm (%)"
                : "Giá trị giảm (VND)"
            }
            value={form.discountValue}
            onChange={(e) =>
              setForm((s) => ({ ...s, discountValue: e.target.value }))
            }
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
              placeholder="Min order (tuỳ chọn)"
              value={form.minOrderValue}
              onChange={(e) =>
                setForm((s) => ({ ...s, minOrderValue: e.target.value }))
              }
            />
            <input
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
              placeholder="Max discount (tuỳ chọn)"
              value={form.maxDiscountAmount}
              onChange={(e) =>
                setForm((s) => ({ ...s, maxDiscountAmount: e.target.value }))
              }
            />
          </div>

          <input
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            placeholder="Usage limit (tuỳ chọn)"
            value={form.usageLimit}
            onChange={(e) =>
              setForm((s) => ({ ...s, usageLimit: e.target.value }))
            }
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="datetime-local"
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
              value={form.startDate}
              onChange={(e) =>
                setForm((s) => ({ ...s, startDate: e.target.value }))
              }
              title="Start date"
            />
            <input
              type="datetime-local"
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
              value={form.endDate}
              onChange={(e) =>
                setForm((s) => ({ ...s, endDate: e.target.value }))
              }
              title="End date"
            />
          </div>

          <select
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            value={form.status}
            onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          <button
            type="button"
            className="mt-1 w-full px-3 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm"
            onClick={onCreate}
          >
            Tạo voucher
          </button>
        </div>

        <div className="border-t pt-4">
          <div className="font-extrabold text-gray-900">Sửa voucher</div>
          {!selectedVoucher ? (
            <div className="text-sm text-gray-600 mt-2">
              Chọn 1 voucher trong danh sách để chỉnh sửa.
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-2">
              <div className="text-sm font-bold text-gray-700">
                Code:{" "}
                <span className="font-extrabold">{selectedVoucher.code}</span>
              </div>

              <select
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                value={edit.discountType}
                onChange={(e) =>
                  setEdit((s) => ({ ...s, discountType: e.target.value }))
                }
              >
                <option value="PERCENT">PERCENT</option>
                <option value="FIXED_AMOUNT">FIXED_AMOUNT</option>
              </select>

              <input
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                placeholder={
                  edit.discountType === "PERCENT"
                    ? "Giá trị giảm (%)"
                    : "Giá trị giảm (VND)"
                }
                value={edit.discountValue}
                onChange={(e) =>
                  setEdit((s) => ({ ...s, discountValue: e.target.value }))
                }
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  placeholder="Min order"
                  value={edit.minOrderValue}
                  onChange={(e) =>
                    setEdit((s) => ({ ...s, minOrderValue: e.target.value }))
                  }
                />
                <input
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  placeholder="Max discount (trống = bỏ)"
                  value={edit.maxDiscountAmount}
                  onChange={(e) =>
                    setEdit((s) => ({
                      ...s,
                      maxDiscountAmount: e.target.value,
                    }))
                  }
                />
              </div>

              <input
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                placeholder="Usage limit (trống = bỏ)"
                value={edit.usageLimit}
                onChange={(e) =>
                  setEdit((s) => ({ ...s, usageLimit: e.target.value }))
                }
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="datetime-local"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  value={edit.startDate}
                  onChange={(e) =>
                    setEdit((s) => ({ ...s, startDate: e.target.value }))
                  }
                />
                <input
                  type="datetime-local"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  value={edit.endDate}
                  onChange={(e) =>
                    setEdit((s) => ({ ...s, endDate: e.target.value }))
                  }
                />
              </div>

              <select
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                value={edit.status}
                onChange={(e) =>
                  setEdit((s) => ({ ...s, status: e.target.value }))
                }
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>

              <button
                type="button"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-900 text-white font-bold text-sm"
                onClick={onUpdate}
              >
                Lưu voucher
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
