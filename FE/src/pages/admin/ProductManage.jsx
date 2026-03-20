import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { productService } from "../../services";
import ProductImageUpload from "../../components/admin/ProductImageUpload";

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user ?? parsed;
  } catch {
    return null;
  }
}

export default function ProductManage() {
  const token = localStorage.getItem("token");
  const user = getStoredUser();
  const role = user?.role;
  const canEdit = role === "ADMIN" || role === "STAFF";

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const [specs, setSpecs] = useState([{ specKey: "", specValue: "" }]);
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("specs"); // "specs" or "images"

  const filteredProducts = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return products;
    return products.filter((p) => {
      const name = String(p?.name ?? "").toLowerCase();
      const id = String(p?._id ?? p?.id ?? "").toLowerCase();
      const slug = String(p?.slug ?? "").toLowerCase();
      return name.includes(query) || id.includes(query) || slug.includes(query);
    });
  }, [products, q]);

  const selectedProduct = useMemo(() => {
    return (
      products.find((p) => String(p?._id ?? p?.id) === String(selectedId)) ??
      null
    );
  }, [products, selectedId]);

  useEffect(() => {
    if (!token) return;
    if (!canEdit) return;

    let isMounted = true;
    (async () => {
      try {
        setLoadingProducts(true);
        const list = await productService.getProducts();
        if (!isMounted) return;
        setProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!isMounted) return;
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Không tải được danh sách sản phẩm",
        );
        setProducts([]);
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [token, canEdit]);

  useEffect(() => {
    if (!selectedId) return;
    let isMounted = true;

    (async () => {
      try {
        setLoadingSpecs(true);
        const list = await productService.getProductSpecs(selectedId);
        if (!isMounted) return;
        if (Array.isArray(list) && list.length > 0) {
          setSpecs(
            list.map((s) => ({
              specKey: s?.specKey ?? "",
              specValue: s?.specValue ?? "",
            })),
          );
        } else {
          setSpecs([{ specKey: "", specValue: "" }]);
        }
      } catch (err) {
        if (!isMounted) return;
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Không tải được thông số",
        );
        setSpecs([{ specKey: "", specValue: "" }]);
      } finally {
        if (isMounted) setLoadingSpecs(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedId]);

  function updateSpecRow(index, patch) {
    setSpecs((rows) =>
      rows.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function addRow() {
    setSpecs((rows) => [...rows, { specKey: "", specValue: "" }]);
  }

  function removeRow(index) {
    setSpecs((rows) => {
      const next = rows.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ specKey: "", specValue: "" }];
    });
  }

  async function handleSave() {
    if (!selectedId) {
      toast.info("Chọn 1 sản phẩm trước");
      return;
    }

    const cleaned = specs
      .map((s) => ({
        specKey: String(s?.specKey ?? "").trim(),
        specValue: String(s?.specValue ?? "").trim(),
      }))
      .filter((s) => s.specKey && s.specValue);

    try {
      setSaving(true);
      const saved = await productService.replaceProductSpecs(
        selectedId,
        cleaned,
      );
      setSpecs(
        Array.isArray(saved) && saved.length > 0
          ? saved.map((s) => ({
              specKey: s?.specKey ?? "",
              specValue: s?.specValue ?? "",
            }))
          : [{ specKey: "", specValue: "" }],
      );
      toast.success("Đã lưu thông số kỹ thuật");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không lưu được thông số",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="text-xl font-extrabold text-gray-900">
            Quản lý sản phẩm
          </div>
          <div className="mt-2 text-gray-700">
            Vui lòng{" "}
            <Link
              className="text-blue-600 font-bold hover:underline"
              to="/login"
            >
              đăng nhập
            </Link>
            .
          </div>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="text-xl font-extrabold text-gray-900">
            Quản lý sản phẩm
          </div>
          <div className="mt-2 text-red-600 font-bold">
            Bạn không có quyền chỉnh sửa (cần ADMIN/STAFF).
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-extrabold text-gray-900">
            Admin • Thông số sản phẩm
          </h1>
          {selectedId ? (
            <Link
              to={`/product/${selectedId}`}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              Xem trang chi tiết
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="font-extrabold text-gray-900">Chọn sản phẩm</div>
            <div className="mt-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Tìm theo tên / id / slug"
              />
            </div>

            <div className="mt-3">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">-- Chọn sản phẩm --</option>
                {filteredProducts.map((p) => {
                  const pid = p?._id ?? p?.id;
                  return (
                    <option key={pid} value={pid}>
                      {p?.name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              {loadingProducts
                ? "Đang tải sản phẩm..."
                : `Tổng: ${filteredProducts.length} sản phẩm`}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 mb-4">
              <button
                onClick={() => setActiveTab("specs")}
                className={`px-4 py-2 font-semibold text-sm ${
                  activeTab === "specs"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-700"
                }`}
              >
                Thông số kỹ thuật
              </button>
              <button
                onClick={() => setActiveTab("images")}
                className={`px-4 py-2 font-semibold text-sm ${
                  activeTab === "images"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-700"
                }`}
              >
                Quản lý hình ảnh
              </button>
            </div>

            {/* Specs Tab */}
            {activeTab === "specs" && (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-extrabold text-gray-900">
                      Thông số kỹ thuật
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-1">
                      {selectedProduct
                        ? selectedProduct.name
                        : "Chưa chọn sản phẩm"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg border border-gray-200 font-extrabold text-sm hover:bg-gray-50 disabled:opacity-50"
                      onClick={addRow}
                      disabled={!selectedId || loadingSpecs}
                    >
                      + Thêm dòng
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg bg-blue-600 text-white font-extrabold text-sm hover:bg-blue-700 disabled:opacity-50"
                      onClick={handleSave}
                      disabled={!selectedId || loadingSpecs || saving}
                    >
                      {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                  </div>
                </div>

                {loadingSpecs ? (
                  <div className="mt-4 text-gray-600">Đang tải thông số...</div>
                ) : !selectedId ? (
                  <div className="mt-4 text-gray-600">
                    Chọn 1 sản phẩm để chỉnh sửa.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {specs.map((row, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-center"
                      >
                        <input
                          value={row.specKey}
                          onChange={(e) =>
                            updateSpecRow(idx, { specKey: e.target.value })
                          }
                          className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder="VD: CPU"
                        />
                        <input
                          value={row.specValue}
                          onChange={(e) =>
                            updateSpecRow(idx, { specValue: e.target.value })
                          }
                          className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder="VD: Intel Core i5 12400F"
                        />
                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg border border-red-200 text-red-600 font-extrabold hover:bg-red-50"
                          onClick={() => removeRow(idx)}
                        >
                          Xóa
                        </button>
                      </div>
                    ))}

                    <div className="text-xs text-gray-500">
                      Mẹo: để trống key/value sẽ không được lưu.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Images Tab */}
            {activeTab === "images" && (
              <div>
                <ProductImageUpload productId={selectedId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
