import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiPlus, FiRefreshCcw, FiTrash2 } from "react-icons/fi";

import PartPickerModal from "../../components/pc-builder/PartPickerModal";
import { productService, savedBuildService } from "../../services";
import { useCart } from "../../context";

function formatVnd(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price ?? 0);
}

const PARTS = [
  { key: "CPU", label: "CPU" },
  { key: "MAINBOARD", label: "MAINBOARD" },
  { key: "RAM", label: "RAM" },
  { key: "VGA", label: "CARD ĐỒ HỌA" },
  { key: "SSD", label: "Ổ CỨNG" },
  { key: "PSU", label: "NGUỒN (PSU)" },
  { key: "COOLER", label: "TẢN NHIỆT" },
  { key: "CASE", label: "VỎ CASE" },
  { key: "MONITOR", label: "MÀN HÌNH" },
];

export default function BuildPcPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();

  const [selected, setSelected] = useState(() => ({}));

  const [pickerOpen, setPickerOpen] = useState(false);
  const [activePart, setActivePart] = useState(null);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [productsByPart, setProductsByPart] = useState(() => ({}));

  const total = useMemo(() => {
    return PARTS.reduce((sum, p) => {
      const item = selected[p.key];
      return sum + Number(item?.price ?? 0);
    }, 0);
  }, [selected]);

  const pickedCount = useMemo(
    () => PARTS.filter((p) => Boolean(selected[p.key])).length,
    [selected],
  );

  async function ensureLoggedIn() {
    const token = localStorage.getItem("token");
    if (token) return true;

    toast.info("Vui lòng đăng nhập để tiếp tục");
    navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
    return false;
  }

  async function openPicker(partKey) {
    setActivePart(partKey);
    setPickerOpen(true);
    setProductsError(null);

    if (productsByPart[partKey]) return;

    try {
      setLoadingProducts(true);
      const list = await productService.getProducts({ subCategory: partKey });
      setProductsByPart((prev) => ({ ...prev, [partKey]: list }));
    } catch (err) {
      setProductsError(
        err?.response?.data?.message ||
          err?.message ||
          "Không tải được sản phẩm",
      );
    } finally {
      setLoadingProducts(false);
    }
  }

  function handlePickProduct(product) {
    if (!activePart) return;
    setSelected((prev) => ({ ...prev, [activePart]: product }));
    setPickerOpen(false);
    toast.success("Đã chọn linh kiện");
  }

  function handleRemove(partKey) {
    setSelected((prev) => {
      const next = { ...prev };
      delete next[partKey];
      return next;
    });
  }

  function handleReset() {
    setSelected({});
    toast.info("Đã làm mới cấu hình");
  }

  async function handleAddToCart() {
    const ok = await ensureLoggedIn();
    if (!ok) return;

    const items = PARTS.map((p) => selected[p.key]).filter(Boolean);
    if (items.length === 0) {
      toast.info("Bạn chưa chọn linh kiện nào");
      return;
    }

    try {
      const results = await Promise.allSettled(
        items.map((p) => addItem({ productId: p?._id ?? p?.id, quantity: 1 })),
      );

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        toast.warning(
          `Đã thêm ${items.length - failed.length}/${items.length} sản phẩm vào giỏ hàng`,
        );
      } else {
        toast.success("Đã thêm cấu hình vào giỏ hàng");
      }

      navigate("/cart");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không thêm vào giỏ được",
      );
    }
  }

  async function handleSaveBuild() {
    const ok = await ensureLoggedIn();
    if (!ok) return;

    const items = PARTS.map((p) => selected[p.key]).filter(Boolean);
    if (items.length === 0) {
      toast.info("Bạn chưa chọn linh kiện nào");
      return;
    }

    const name = window.prompt("Nhập tên cấu hình (ví dụ: PC Gaming 25tr)");
    if (!name || !String(name).trim()) return;

    try {
      await savedBuildService.createBuild({
        name: String(name).trim(),
        share: false,
        items: items
          .map((p) => ({ product: p?._id ?? p?.id }))
          .filter((x) => x.product),
      });
      toast.success("Đã lưu cấu hình");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không lưu được cấu hình",
      );
    }
  }

  function downloadCsv() {
    const rows = [
      ["Hạng mục", "Sản phẩm", "Giá"],
      ...PARTS.map((p) => {
        const item = selected[p.key];
        return [p.label, item?.name ?? "", String(item?.price ?? 0)];
      }),
      ["", "Tổng", String(total)],
    ];

    const csv = rows
      .map((r) =>
        r.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");

    // Add BOM so Excel opens Vietnamese correctly
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pc-build-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const pickerTitle = useMemo(() => {
    const part = PARTS.find((p) => p.key === activePart);
    return part ? `Chọn ${part.label}` : "Chọn linh kiện";
  }, [activePart]);

  const pickerProducts = activePart ? productsByPart[activePart] : [];

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="container mx-auto px-4 py-4 text-sm text-gray-600 mb-2">
        <Link to="/" className="hover:text-red-600">
          Trang chủ
        </Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900 font-medium">
          Xây dựng máy tính - tạo máy tính
        </span>
      </div>

      <div className="container mx-auto px-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center w-full">
              CHỌN LINH KIỆN XÂY DỰNG CẤU HÌNH
            </h1>

            <div className="w-full flex items-center justify-between mt-3">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold"
              >
                <FiRefreshCcw />
                LÀM MỚI
              </button>

              <div className="text-right">
                <div className="text-gray-900 font-extrabold">
                  Chi phí dự tính:{" "}
                  <span className="text-red-600">{formatVnd(total)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Đã chọn {pickedCount}/{PARTS.length} linh kiện
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-xl overflow-hidden">
              <tbody>
                {PARTS.map((p, idx) => {
                  const item = selected[p.key];
                  return (
                    <tr key={p.key} className="border-b last:border-b-0">
                      <td className="w-64 px-4 py-4 font-extrabold text-gray-900 bg-gray-50">
                        {idx + 1}. {p.label}
                      </td>
                      <td className="px-4 py-4">
                        {item ? (
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-bold text-gray-900 line-clamp-2">
                                {item.name}
                              </div>
                              <div className="text-red-600 font-extrabold">
                                {formatVnd(item.price)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link
                                to={item?._id ? `/product/${item._id}` : "#"}
                                className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 font-bold"
                              >
                                Xem
                              </Link>
                              <button
                                type="button"
                                className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-extrabold inline-flex items-center gap-2"
                                onClick={() => handleRemove(p.key)}
                              >
                                <FiTrash2 />
                                Bỏ
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold"
                            onClick={() => openPicker(p.key)}
                          >
                            <FiPlus />
                            Chọn {p.label}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col md:flex-row gap-3">
            <button
              type="button"
              onClick={downloadCsv}
              className="flex-1 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-extrabold"
            >
              TẢI FILE EXCEL CẤU HÌNH (CSV)
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-extrabold"
            >
              XEM & IN
            </button>
            <button
              type="button"
              onClick={handleSaveBuild}
              className="flex-1 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-extrabold"
            >
              LƯU CẤU HÌNH
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold"
            >
              THÊM VÀO GIỎ HÀNG
            </button>
          </div>
        </div>
      </div>

      <PartPickerModal
        open={pickerOpen}
        title={pickerTitle}
        products={pickerProducts}
        loading={loadingProducts}
        error={productsError}
        onClose={() => setPickerOpen(false)}
        onPick={handlePickProduct}
      />
    </div>
  );
}
