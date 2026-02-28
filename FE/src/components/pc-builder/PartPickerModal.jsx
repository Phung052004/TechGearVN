import React, { useEffect, useMemo, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { FALLBACK_PRODUCT_IMAGE } from "../../constants/images";

function formatVnd(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price ?? 0);
}

export default function PartPickerModal({
  open,
  title,
  products,
  loading,
  error,
  onClose,
  onPick,
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = Array.isArray(products) ? products : [];
    if (!q) return list;
    return list.filter((p) => (p?.name ?? "").toLowerCase().includes(q));
  }, [products, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close"
      />

      <div className="absolute inset-x-0 top-10 mx-auto w-[95%] max-w-5xl">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold text-gray-900">
                {title}
              </div>
              <div className="text-sm text-gray-500">
                Chọn 1 sản phẩm để thêm vào cấu hình
              </div>
            </div>
            <button
              type="button"
              className="w-10 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
              onClick={onClose}
              aria-label="Đóng"
            >
              <FiX />
            </button>
          </div>

          <div className="p-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên..."
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>

            {error ? (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="mt-4">Đang tải sản phẩm...</div>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[60vh] overflow-auto pr-1">
                {filtered.map((p) => {
                  const id = p?._id ?? p?.id;
                  const inStock = Number(p?.countInStock ?? 0) > 0;
                  return (
                    <div
                      key={id ?? JSON.stringify(p)}
                      className="rounded-2xl border border-gray-200 hover:shadow-sm bg-white overflow-hidden"
                    >
                      <div className="p-3 flex gap-3">
                        <div className="w-20 h-20 rounded-xl border border-gray-100 bg-white flex items-center justify-center overflow-hidden">
                          <img
                            src={p?.thumbnail ?? p?.image}
                            alt={p?.name ?? "Product"}
                            className="w-full h-full object-contain"
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 line-clamp-2">
                            {p?.name}
                          </div>
                          <div className="mt-1 text-red-600 font-extrabold">
                            {formatVnd(p?.price)}
                          </div>
                          <div className="mt-1 text-xs">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full font-bold ${
                                inStock
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-600 text-white"
                              }`}
                            >
                              {inStock ? "Còn hàng" : "Hết hàng"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 pb-3">
                        <button
                          type="button"
                          disabled={!id}
                          className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-extrabold"
                          onClick={() => onPick?.(p)}
                        >
                          Chọn
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filtered.length === 0 && !loading ? (
                  <div className="col-span-full text-center py-10 text-gray-600">
                    Không tìm thấy sản phẩm phù hợp.
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
