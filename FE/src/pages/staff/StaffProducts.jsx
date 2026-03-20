import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "react-toastify";
import { IoClose, IoImage } from "react-icons/io5";

import {
  productService,
  supplierService,
  importReceiptService,
  categoryService,
} from "../../services";

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

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "px-3 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm"
          : "px-3 py-2 rounded-lg border border-gray-200 font-bold text-sm"
      }
    >
      {children}
    </button>
  );
}

export default function StaffProducts() {
  const [tab, setTab] = useState("products");
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    originalPrice: "",
    price: "",
    image: "",
    categoryId: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    originalPrice: "",
    price: "",
    image: "",
    categoryId: "",
    status: "ACTIVE",
  });

  const [specsLoading, setSpecsLoading] = useState(false);
  const [specsSaving, setSpecsSaving] = useState(false);
  const [specs, setSpecs] = useState([]);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageLibrary, setImageLibrary] = useState([]);
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const [receipt, setReceipt] = useState({
    supplierId: "",
    note: "",
    details: [{ productId: "", quantity: 1, importPrice: 0 }],
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      String(p?.name || "")
        .toLowerCase()
        .includes(q),
    );
  }, [products, query]);

  const selectedProduct = useMemo(() => {
    if (!selectedId) return null;
    return products.find((p) => p._id === selectedId) || null;
  }, [products, selectedId]);

  async function reloadAll() {
    try {
      setLoading(true);
      const [pRes, sRes, cRes] = await Promise.all([
        productService.getAllProducts(),
        supplierService.getAllSuppliers(),
        categoryService.getCategories(),
      ]);
      setProducts(pRes || []);
      setSuppliers(sRes || []);
      setCategories(cRes || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  async function handleImageSelect(e, isEdit = false) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);

      const uploaded = await productService.uploadProductImage(formData);
      const imageUrl = uploaded?.url || uploaded;

      if (isEdit) {
        setEditForm((s) => ({ ...s, image: imageUrl }));
      } else {
        setProductForm((s) => ({ ...s, image: imageUrl }));
      }

      // Add to library
      setImageLibrary((prev) => [imageUrl, ...prev]);
      toast.success("Đã upload ảnh");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Lỗi upload ảnh",
      );
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  function selectFromLibrary(imageUrl, isEdit = false) {
    if (isEdit) {
      setEditForm((s) => ({ ...s, image: imageUrl }));
    } else {
      setProductForm((s) => ({ ...s, image: imageUrl }));
    }
    setShowImageLibrary(false);
  }

  useEffect(() => {
    reloadAll();
  }, []);

  // Reset page when query changes
  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (!selectedProduct) return;
    const categoryId =
      selectedProduct?.category?._id || selectedProduct?.category || "";

    setEditForm({
      name: selectedProduct.name || "",
      description: selectedProduct.description || "",
      originalPrice:
        selectedProduct.originalPrice ?? selectedProduct.oldPrice ?? "",
      price: selectedProduct.price ?? "",
      image: selectedProduct.image || "",
      categoryId,
      status: selectedProduct.status || "ACTIVE",
    });
  }, [selectedProduct]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedProduct?._id) {
        setSpecs([]);
        return;
      }

      try {
        setSpecsLoading(true);
        const list = await productService.getProductSpecs(selectedProduct._id);
        if (!mounted) return;
        setSpecs(Array.isArray(list) ? list : []);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Không tải được specs");
      } finally {
        if (mounted) setSpecsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedProduct?._id]);

  function updateSpecRow(idx, patch) {
    setSpecs((rows) => {
      const next = [...rows];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  function addSpecRow() {
    setSpecs((rows) => [...rows, { specKey: "", specValue: "" }]);
  }

  function removeSpecRow(idx) {
    setSpecs((rows) => rows.filter((_, i) => i !== idx));
  }

  async function saveSpecs() {
    if (!selectedProduct?._id) return;
    try {
      setSpecsSaving(true);
      const payload = specs
        .map((s) => ({
          specKey: String(s?.specKey || "").trim(),
          specValue: String(s?.specValue || "").trim(),
        }))
        .filter((s) => s.specKey && s.specValue);

      const saved = await productService.replaceProductSpecs(
        selectedProduct._id,
        payload,
      );
      setSpecs(Array.isArray(saved) ? saved : []);
      toast.success("Đã lưu specs");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Lưu specs thất bại");
    } finally {
      setSpecsSaving(false);
    }
  }

  async function createProduct() {
    try {
      if (!productForm.categoryId) {
        toast.error("Chọn danh mục");
        return;
      }
      if (!productForm.image) {
        toast.error("Nhập image URL");
        return;
      }

      const originalPrice = Number(productForm.originalPrice || 0);
      const price = Number(productForm.price || 0);
      if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
        toast.error("Nhập giá gốc hợp lệ");
        return;
      }
      if (!Number.isFinite(price) || price <= 0) {
        toast.error("Nhập giá sau giảm hợp lệ");
        return;
      }
      if (price > originalPrice) {
        toast.error("Giá sau giảm không được lớn hơn giá gốc");
        return;
      }

      const payload = {
        name: productForm.name,
        description: productForm.description,
        image: productForm.image,
        category: productForm.categoryId,
        originalPrice,
        price,
      };
      await productService.createProduct(payload);
      toast.success("Đã thêm sản phẩm");
      setProductForm({
        name: "",
        description: "",
        originalPrice: "",
        price: "",
        image: "",
        categoryId: "",
      });
      await reloadAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Thêm sản phẩm thất bại");
    }
  }

  async function updateProduct() {
    if (!selectedProduct) return;
    try {
      const originalPrice = Number(editForm.originalPrice || 0);
      const price = Number(editForm.price || 0);
      if (!Number.isFinite(price) || price <= 0) {
        toast.error("Nhập giá sau giảm hợp lệ");
        return;
      }
      if (
        Number.isFinite(originalPrice) &&
        originalPrice > 0 &&
        price > originalPrice
      ) {
        toast.error("Giá sau giảm không được lớn hơn giá gốc");
        return;
      }

      const payload = {
        name: editForm.name,
        description: editForm.description,
        image: editForm.image,
        status: editForm.status,
        originalPrice:
          Number.isFinite(originalPrice) && originalPrice > 0
            ? originalPrice
            : undefined,
        price,
      };
      if (editForm.categoryId) payload.category = editForm.categoryId;
      await productService.updateProduct(selectedProduct._id, payload);
      toast.success("Đã cập nhật sản phẩm");
      await reloadAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cập nhật thất bại");
    }
  }

  function updateReceiptDetail(idx, patch) {
    setReceipt((r) => {
      const next = [...r.details];
      next[idx] = { ...next[idx], ...patch };
      return { ...r, details: next };
    });
  }

  function addReceiptRow() {
    setReceipt((r) => ({
      ...r,
      details: [...r.details, { productId: "", quantity: 1, importPrice: 0 }],
    }));
  }

  function removeReceiptRow(idx) {
    setReceipt((r) => ({
      ...r,
      details: r.details.filter((_, i) => i !== idx),
    }));
  }

  async function createReceipt() {
    try {
      const details = receipt.details
        .filter((d) => d.productId)
        .map((d) => ({
          product: d.productId,
          quantity: Number(d.quantity || 0),
          importPrice: Number(d.importPrice || 0),
        }));

      if (!receipt.supplierId) {
        toast.error("Chọn nhà cung cấp");
        return;
      }
      if (details.length === 0) {
        toast.error("Thêm ít nhất 1 dòng nhập hàng");
        return;
      }

      await importReceiptService.createImportReceipt({
        supplier: receipt.supplierId,
        note: receipt.note,
        details,
      });

      toast.success("Đã tạo phiếu nhập");
      setReceipt({
        supplierId: "",
        note: "",
        details: [{ productId: "", quantity: 1, importPrice: 0 }],
      });
      await reloadAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Tạo phiếu nhập thất bại");
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold text-gray-900">
              Sản phẩm & Kho
            </div>
            <div className="text-sm text-gray-600">
              Thêm/sửa sản phẩm • Nhập kho bằng phiếu nhập
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <TabButton
              active={tab === "products"}
              onClick={() => setTab("products")}
            >
              Sản phẩm
            </TabButton>
            <TabButton
              active={tab === "import"}
              onClick={() => setTab("import")}
            >
              Nhập kho
            </TabButton>
          </div>
        </div>
      </div>

      {tab === "products" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="font-extrabold text-gray-900">Danh sách</div>
              <input
                className="w-full md:w-[320px] px-3 py-2 rounded-lg border border-gray-200 text-sm"
                placeholder="Tìm sản phẩm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="mt-3 overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2 font-extrabold">Tên</th>
                    <th className="text-right px-3 py-2 font-extrabold">Giá</th>
                    <th className="text-right px-3 py-2 font-extrabold">Tồn</th>
                    <th className="text-left px-3 py-2 font-extrabold">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-3 py-3" colSpan={4}>
                        Đang tải...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3" colSpan={4}>
                        Không có sản phẩm
                      </td>
                    </tr>
                  ) : (
                    // Paginate filtered products
                    (() => {
                      const totalPages = Math.max(
                        1,
                        Math.ceil(filtered.length / pageSize),
                      );
                      const pageItems = filtered.slice(
                        (page - 1) * pageSize,
                        page * pageSize,
                      );
                      return pageItems.map((p) => (
                        <tr
                          key={p._id}
                          className="border-t hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedId(p._id)}
                        >
                          <td className="px-3 py-3 font-bold text-gray-900">
                            {p.name}
                          </td>
                          <td className="px-3 py-3 text-right font-extrabold">
                            {formatMoney(p.price)}
                          </td>
                          <td className="px-3 py-3 text-right font-bold">
                            {p.stockQuantity ?? "-"}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={
                                p.status === "INACTIVE"
                                  ? "text-rose-700 font-extrabold"
                                  : "text-emerald-700 font-extrabold"
                              }
                            >
                              {p.status || "ACTIVE"}
                            </span>
                          </td>
                        </tr>
                      ));
                    })()
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls for products */}
            {filtered.length > pageSize && (
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Tổng {filtered.length} sản phẩm
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1 rounded border text-sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </button>
                  <span className="text-sm">{page}</span>
                  <button
                    className="px-3 py-1 rounded border text-sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * pageSize >= filtered.length}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
            <div>
              <div className="font-extrabold text-gray-900">Thêm sản phẩm</div>
              <div className="grid grid-cols-1 gap-2 mt-2">
                <input
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  placeholder="Tên"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm((s) => ({ ...s, name: e.target.value }))
                  }
                />
                <input
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  placeholder="Giá gốc"
                  value={productForm.originalPrice}
                  onChange={(e) =>
                    setProductForm((s) => ({
                      ...s,
                      originalPrice: e.target.value,
                    }))
                  }
                />
                <input
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  placeholder="Giá sau giảm"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm((s) => ({ ...s, price: e.target.value }))
                  }
                />

                {/* Image Upload Section */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-600">
                    Hình ảnh
                  </div>
                  {productForm.image && (
                    <img
                      src={productForm.image}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleImageSelect(e, false)}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex-1 px-2 py-2 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-50"
                    >
                      {uploadingImage ? "Đang upload..." : "📤 Chọn file"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowImageLibrary(!showImageLibrary)}
                      className="flex-1 px-2 py-2 rounded-lg border border-blue-200 text-xs font-bold text-blue-600 hover:bg-blue-50"
                    >
                      📸 Thư viện
                    </button>
                  </div>
                  <input
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    placeholder="Hoặc nhập URL"
                    value={productForm.image}
                    onChange={(e) =>
                      setProductForm((s) => ({ ...s, image: e.target.value }))
                    }
                  />

                  {/* Image Library */}
                  {showImageLibrary && imageLibrary.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-2 max-h-40 overflow-y-auto">
                      <div className="text-xs font-semibold text-gray-600 mb-2">
                        Danh sách ảnh
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {imageLibrary.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Lib ${idx}`}
                            onClick={() => selectFromLibrary(img, false)}
                            className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-75 border-2 border-transparent hover:border-blue-400"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <select
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  value={productForm.categoryId}
                  onChange={(e) =>
                    setProductForm((s) => ({
                      ...s,
                      categoryId: e.target.value,
                    }))
                  }
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <textarea
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  placeholder="Mô tả"
                  rows={3}
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm((s) => ({
                      ...s,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <button
                type="button"
                className="mt-3 w-full px-3 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm"
                onClick={createProduct}
              >
                Thêm
              </button>
            </div>

            <div className="border-t pt-4">
              <div className="font-extrabold text-gray-900">Sửa sản phẩm</div>
              {!selectedProduct ? (
                <div className="text-sm text-gray-600 mt-2">
                  Chọn 1 sản phẩm trong danh sách.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 mt-2">
                  <input
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    placeholder="Tên"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((s) => ({ ...s, name: e.target.value }))
                    }
                  />
                  <input
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    placeholder="Giá gốc"
                    value={editForm.originalPrice}
                    onChange={(e) =>
                      setEditForm((s) => ({
                        ...s,
                        originalPrice: e.target.value,
                      }))
                    }
                  />
                  <input
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    placeholder="Giá sau giảm"
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm((s) => ({ ...s, price: e.target.value }))
                    }
                  />

                  {/* Image Upload Section - Edit */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-600">
                      Hình ảnh
                    </div>
                    {editForm.image && (
                      <img
                        src={editForm.image}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    )}
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={editFileInputRef}
                        onChange={(e) => handleImageSelect(e, true)}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="flex-1 px-2 py-2 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-50"
                      >
                        {uploadingImage ? "Đang upload..." : "📤 Chọn file"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowImageLibrary(!showImageLibrary)}
                        className="flex-1 px-2 py-2 rounded-lg border border-blue-200 text-xs font-bold text-blue-600 hover:bg-blue-50"
                      >
                        📸 Thư viện
                      </button>
                    </div>
                    <input
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      placeholder="Hoặc nhập URL"
                      value={editForm.image}
                      onChange={(e) =>
                        setEditForm((s) => ({ ...s, image: e.target.value }))
                      }
                    />

                    {/* Image Library */}
                    {showImageLibrary && imageLibrary.length > 0 && (
                      <div className="border border-gray-200 rounded-lg p-2 max-h-40 overflow-y-auto">
                        <div className="text-xs font-semibold text-gray-600 mb-2">
                          Danh sách ảnh
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {imageLibrary.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Lib ${idx}`}
                              onClick={() => selectFromLibrary(img, true)}
                              className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-75 border-2 border-transparent hover:border-blue-400"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <select
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    value={editForm.categoryId}
                    onChange={(e) =>
                      setEditForm((s) => ({ ...s, categoryId: e.target.value }))
                    }
                  >
                    <option value="">-- Danh mục --</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    placeholder="Mô tả"
                    rows={3}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((s) => ({
                        ...s,
                        description: e.target.value,
                      }))
                    }
                  />
                  <select
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((s) => ({ ...s, status: e.target.value }))
                    }
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>

                  <button
                    type="button"
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-900 text-white font-bold text-sm"
                    onClick={updateProduct}
                  >
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-extrabold text-gray-900">Specs</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border border-gray-200 font-bold text-sm"
                    onClick={addSpecRow}
                    disabled={!selectedProduct || specsSaving}
                  >
                    Thêm
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm"
                    onClick={saveSpecs}
                    disabled={!selectedProduct || specsSaving}
                  >
                    Lưu specs
                  </button>
                </div>
              </div>

              {!selectedProduct ? null : specsLoading ? (
                <div className="text-sm text-gray-600 mt-2">
                  Đang tải specs...
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {specs.length === 0 ? (
                    <div className="text-sm text-gray-600">
                      Chưa có specs. Bấm “Thêm” để tạo.
                    </div>
                  ) : null}

                  {specs.map((s, idx) => (
                    <div
                      key={s._id || `spec-${idx}`}
                      className="grid grid-cols-12 gap-2 items-center"
                    >
                      <input
                        className="col-span-5 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        placeholder="specKey (VD: Socket)"
                        value={s.specKey || ""}
                        onChange={(e) =>
                          updateSpecRow(idx, { specKey: e.target.value })
                        }
                        disabled={specsSaving}
                      />
                      <input
                        className="col-span-6 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        placeholder="specValue (VD: AM5)"
                        value={s.specValue || ""}
                        onChange={(e) =>
                          updateSpecRow(idx, { specValue: e.target.value })
                        }
                        disabled={specsSaving}
                      />
                      <button
                        type="button"
                        className="col-span-1 px-3 py-2 rounded-lg border border-rose-200 text-rose-700 font-bold text-sm"
                        onClick={() => removeSpecRow(idx)}
                        disabled={specsSaving}
                        title="Xóa dòng"
                      >
                        X
                      </button>
                    </div>
                  ))}

                  <div className="text-xs text-gray-600">
                    Lưu sẽ thay thế toàn bộ danh sách specs của sản phẩm.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="font-extrabold text-gray-900">Tạo phiếu nhập</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <div className="text-sm font-bold text-gray-700">
                Nhà cung cấp
              </div>
              <select
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                value={receipt.supplierId}
                onChange={(e) =>
                  setReceipt((r) => ({ ...r, supplierId: e.target.value }))
                }
              >
                <option value="">-- Chọn --</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-700">Ghi chú</div>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                value={receipt.note}
                onChange={(e) =>
                  setReceipt((r) => ({ ...r, note: e.target.value }))
                }
                placeholder="VD: Nhập hàng tháng 2"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-extrabold text-gray-900">Chi tiết</div>
            <div className="mt-2 space-y-2">
              {receipt.details.map((d, idx) => (
                <div
                  key={`row-${idx}`}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                >
                  <div className="md:col-span-6">
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      value={d.productId}
                      onChange={(e) =>
                        updateReceiptDetail(idx, { productId: e.target.value })
                      }
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="number"
                      min={1}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      value={d.quantity}
                      onChange={(e) =>
                        updateReceiptDetail(idx, {
                          quantity: Number(e.target.value || 0),
                        })
                      }
                      placeholder="SL"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      value={d.importPrice}
                      onChange={(e) =>
                        updateReceiptDetail(idx, {
                          importPrice: Number(e.target.value || 0),
                        })
                      }
                      placeholder="Giá nhập"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg border border-rose-200 text-rose-700 font-bold text-sm"
                      onClick={() => removeReceiptRow(idx)}
                      disabled={receipt.details.length <= 1}
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="px-3 py-2 rounded-lg border border-gray-200 font-bold text-sm"
                onClick={addReceiptRow}
              >
                Thêm dòng
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm"
                onClick={createReceipt}
              >
                Tạo phiếu nhập
              </button>
            </div>

            <div className="text-xs text-gray-600 mt-2">
              Tồn kho sẽ được cộng tự động sau khi tạo phiếu nhập.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
