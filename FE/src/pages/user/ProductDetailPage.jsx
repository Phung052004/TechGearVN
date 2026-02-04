import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { toast } from "react-toastify";
import {
  FiChevronLeft,
  FiChevronRight,
  FiMinus,
  FiPlus,
  FiShoppingCart,
} from "react-icons/fi";

import { productService } from "../../services";
import { useCart } from "../../context";
import { FALLBACK_PRODUCT_IMAGE } from "../../constants/images";

import "swiper/css";
import "swiper/css/navigation";

function formatVnd(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price ?? 0);
}

function getCategoryLabel(product) {
  if (!product) return "";
  if (typeof product.category === "string") return product.category;
  if (product.category?.name) return product.category.name;
  return "";
}

function parseDescriptionBullets(description) {
  if (!description) return [];
  const lines = String(description)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  // keep a short list to match the template
  return lines.slice(0, 10);
}

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [specs, setSpecs] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [qty, setQty] = useState(1);
  const inStock = Number(product?.countInStock ?? 0) > 0;

  const price = Number(product?.price ?? 0);
  const oldPrice = Number(product?.oldPrice ?? 0);
  const saving = oldPrice > price ? oldPrice - price : 0;

  const images = useMemo(() => {
    const list = [];
    const main = product?.image;
    if (main) list.push(main);
    const more = Array.isArray(product?.images) ? product.images : [];
    more.forEach((url) => {
      if (url && url !== main) list.push(url);
    });
    // fallback thumbnails if only 1 image (match template layout)
    if (list.length === 1) {
      return [list[0], list[0], list[0], list[0], list[0]];
    }
    return list;
  }, [product]);

  const descriptionBullets = useMemo(
    () => parseDescriptionBullets(product?.description),
    [product?.description],
  );

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const [p, s] = await Promise.all([
          productService.getProductById(id),
          productService.getProductSpecs(id).catch(() => []),
        ]);

        if (!isMounted) return;
        setProduct(p);
        setSpecs(Array.isArray(s) ? s : []);
        setSelectedImage(0);

        // Similar products by subCategory (legacy seed)
        const subCategory = p?.subCategory;
        if (subCategory) {
          const sim = await productService.getProducts({ subCategory });
          if (!isMounted) return;
          const currentId = p?._id ?? p?.id;
          const filtered = (Array.isArray(sim) ? sim : []).filter(
            (x) => (x?._id ?? x?.id) !== currentId,
          );
          setSimilar(filtered.slice(0, 12));
        } else {
          setSimilar([]);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không tải được sản phẩm",
        );
        setProduct(null);
        setSpecs([]);
        setSimilar([]);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!inStock) setQty(1);
  }, [inStock]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          Đang tải sản phẩm...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          Không có dữ liệu sản phẩm.
        </div>
      </div>
    );
  }

  const categoryLabel = getCategoryLabel(product);
  const subCategoryLabel = product?.subCategory;
  const productId = product?._id ?? product?.id ?? id;

  async function ensureLoggedIn() {
    const token = localStorage.getItem("token");
    if (token) return true;

    toast.info("Vui lòng đăng nhập để tiếp tục");
    navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
    return false;
  }

  async function handleAddToCart(targetProductId, quantity) {
    if (!targetProductId) return;
    const ok = await ensureLoggedIn();
    if (!ok) return;

    try {
      await addItem({ productId: targetProductId, quantity });
      toast.success("Đã thêm vào giỏ hàng");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không thêm vào giỏ được",
      );
    }
  }

  async function handleBuyNow() {
    if (!productId) return;
    if (!inStock) return;
    await handleAddToCart(productId, qty);
    navigate("/checkout");
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-5">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600 mb-4">
          <Link to="/" className="hover:text-blue-600 font-medium">
            Trang chủ
          </Link>
          {subCategoryLabel && (
            <>
              <span className="mx-2">&gt;</span>
              <span className="font-semibold text-gray-900">
                {subCategoryLabel}
              </span>
            </>
          )}
          <span className="mx-2">&gt;</span>
          <span className="font-semibold text-gray-900 line-clamp-1">
            {product?.name}
          </span>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gallery */}
            <div>
              <div className="relative rounded-xl border border-gray-100 overflow-hidden bg-white">
                <img
                  src={images[selectedImage]}
                  alt={product?.name}
                  className="w-full h-[320px] md:h-[420px] object-contain bg-white"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                  }}
                />

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-gray-200 flex items-center justify-center"
                      onClick={() =>
                        setSelectedImage(
                          (i) => (i - 1 + images.length) % images.length,
                        )
                      }
                      aria-label="Previous image"
                    >
                      <FiChevronLeft />
                    </button>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-gray-200 flex items-center justify-center"
                      onClick={() =>
                        setSelectedImage((i) => (i + 1) % images.length)
                      }
                      aria-label="Next image"
                    >
                      <FiChevronRight />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              <div className="mt-3 grid grid-cols-5 gap-2">
                {images.slice(0, 5).map((url, idx) => (
                  <button
                    key={`${url}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    className={`rounded-lg border overflow-hidden bg-white h-[64px] flex items-center justify-center ${
                      idx === selectedImage
                        ? "border-orange-500 ring-2 ring-orange-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    aria-label={`Thumbnail ${idx + 1}`}
                  >
                    <img
                      src={url}
                      alt={product?.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right info */}
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-snug">
                {product?.name}
              </h1>

              {(categoryLabel || subCategoryLabel) && (
                <div className="mt-2 text-sm text-gray-600">
                  {categoryLabel && (
                    <span>
                      Danh mục:{" "}
                      <span className="font-semibold">{categoryLabel}</span>
                    </span>
                  )}
                  {categoryLabel && subCategoryLabel ? <span> | </span> : null}
                  {subCategoryLabel && (
                    <span>
                      Phân loại:{" "}
                      <span className="font-semibold">{subCategoryLabel}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Price bar */}
              <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 overflow-hidden">
                <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-end gap-4 flex-wrap">
                    <div className="text-3xl md:text-4xl font-extrabold text-orange-600">
                      {formatVnd(price)}
                    </div>
                    {oldPrice > price && (
                      <div className="text-gray-400 text-lg line-through font-bold">
                        {formatVnd(oldPrice)}
                      </div>
                    )}
                  </div>

                  {saving > 0 && (
                    <div className="text-sm font-bold text-orange-700">
                      Tiết kiệm: {formatVnd(saving)}
                    </div>
                  )}
                </div>
              </div>

              {/* Description bullets (template-like) */}
              <div className="mt-4">
                <div className="text-base font-extrabold text-gray-900 mb-2">
                  Mô tả sản phẩm
                </div>
                {descriptionBullets.length > 0 ? (
                  <ul className="space-y-1 text-sm text-gray-800">
                    {descriptionBullets.map((line, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="mt-[6px] w-2 h-2 rounded-full bg-teal-600 flex-shrink-0" />
                        <span className="min-w-0">{line}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-600">Chưa có mô tả.</div>
                )}
              </div>

              {/* Upgrade block (UI template) */}
              <div className="mt-5 border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-extrabold text-gray-900">
                  UPGRADE
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-3 items-center">
                    <div className="font-bold text-gray-900">RAM</div>
                    <div className="flex gap-2 flex-wrap">
                      <button className="px-3 py-2 rounded-md border border-orange-500 text-orange-600 font-bold text-sm bg-orange-50">
                        RAM 32GB
                      </button>
                      <button className="px-3 py-2 rounded-md border border-gray-200 hover:border-gray-300 font-bold text-sm text-gray-700">
                        RAM 64GB
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-3 items-center">
                    <div className="font-bold text-gray-900">Ổ cứng SSD</div>
                    <div className="flex gap-2 flex-wrap">
                      <button className="px-3 py-2 rounded-md border border-orange-500 text-orange-600 font-bold text-sm bg-orange-50">
                        SSD 500GB
                      </button>
                      <button className="px-3 py-2 rounded-md border border-gray-200 hover:border-gray-300 font-bold text-sm text-gray-700">
                        SSD 1TB
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promotions */}
              <div className="mt-5 border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-extrabold text-gray-900">
                  KHUYẾN MÃI
                </div>
                <div className="p-4 text-sm text-gray-800">
                  <div className="flex gap-2">
                    <span className="mt-[6px] w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    <span>
                      Bộ PC này đã áp dụng CTKM SHOCK nên không được áp dụng
                      CTKM Chung
                    </span>
                  </div>
                </div>
              </div>

              {/* Qty + CTA */}
              <div className="mt-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="font-bold text-gray-900">Số lượng:</div>
                  <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={!inStock || qty <= 1}
                      aria-label="Decrease"
                    >
                      <FiMinus />
                    </button>
                    <div className="w-12 h-10 flex items-center justify-center font-extrabold text-gray-900">
                      {qty}
                    </div>
                    <button
                      type="button"
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                      onClick={() =>
                        setQty((q) =>
                          Math.min(
                            Number(product?.countInStock ?? 9999) || 9999,
                            q + 1,
                          ),
                        )
                      }
                      disabled={!inStock}
                      aria-label="Increase"
                    >
                      <FiPlus />
                    </button>
                  </div>

                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                      inStock
                        ? "text-green-700 bg-green-100"
                        : "text-white bg-red-600"
                    }`}
                  >
                    {inStock ? "Còn hàng" : "Hết hàng"}
                  </span>
                </div>

                <button
                  type="button"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 rounded-lg"
                  onClick={handleBuyNow}
                  disabled={!inStock}
                >
                  ĐẶT HÀNG
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    className="md:col-span-1 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-extrabold py-3 rounded-lg"
                    onClick={() => handleAddToCart(productId, qty)}
                    disabled={!inStock}
                  >
                    THÊM VÀO GIỎ
                  </button>

                  <button
                    type="button"
                    className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-lg"
                    onClick={() => toast.info("Demo: Trả góp sẽ được nối sau")}
                  >
                    TRẢ GÓP QUA HỒ SƠ
                    <div className="text-xs font-semibold opacity-90">
                      Chi từ 9.424.000 VND/tháng
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="mt-8">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 font-extrabold text-gray-900 border-b border-gray-100">
                THÔNG SỐ KỸ THUẬT
              </div>

              <div className="p-4 md:p-5">
                {specs.length === 0 ? (
                  <div className="text-gray-600">
                    Chưa có thông số kỹ thuật.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-100">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-3 border-b border-gray-100 w-[40%]">
                            Thông số
                          </th>
                          <th className="text-left px-4 py-3 border-b border-gray-100">
                            Giá trị
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {specs.map((s) => (
                          <tr
                            key={s?._id ?? `${s?.specKey}-${s?.specValue}`}
                            className="odd:bg-white even:bg-gray-50"
                          >
                            <td className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">
                              {s?.specKey}
                            </td>
                            <td className="px-4 py-3 border-b border-gray-100 text-gray-800">
                              {s?.specValue}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reviews (placeholder) */}
          <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 font-extrabold text-gray-900 border-b border-gray-100">
              ĐÁNH GIÁ SẢN PHẨM
            </div>
            <div className="p-5 text-gray-600">
              Tính năng đánh giá sẽ được nối sau.
            </div>
          </div>

          {/* Similar products */}
          {similar.length > 0 && (
            <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="font-extrabold text-gray-900">
                  SẢN PHẨM TƯƠNG TỰ
                </div>
                <Link
                  to="/products"
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  Xem tất cả »
                </Link>
              </div>

              <div className="p-4">
                <Swiper
                  modules={[Navigation]}
                  navigation
                  spaceBetween={14}
                  slidesPerView={1}
                  breakpoints={{
                    640: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    1024: { slidesPerView: 4 },
                    1280: { slidesPerView: 5 },
                  }}
                >
                  {similar.map((p) => (
                    <SwiperSlide key={p?._id ?? p?.id}>
                      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow h-full flex flex-col">
                        <Link
                          to={`/product/${p?._id ?? p?.id}`}
                          className="p-3 block"
                        >
                          <img
                            src={p?.thumbnail ?? p?.image}
                            alt={p?.name}
                            className="w-full h-40 object-contain"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                            }}
                          />
                        </Link>

                        <div className="px-3 pb-3 flex flex-col flex-1">
                          <Link
                            to={`/product/${p?._id ?? p?.id}`}
                            className="text-sm font-extrabold text-gray-900 line-clamp-2 hover:text-blue-600 min-h-[40px]"
                          >
                            {p?.name}
                          </Link>

                          <div className="mt-2 flex items-end justify-between gap-2">
                            <div>
                              <div className="text-red-600 font-extrabold">
                                {formatVnd(p?.price)}
                              </div>
                              {Number(p?.oldPrice) > Number(p?.price) && (
                                <div className="text-gray-400 text-xs line-through font-semibold">
                                  {formatVnd(p?.oldPrice)}
                                </div>
                              )}
                            </div>

                            {(Number(p?.discount) || 0) > 0 && (
                              <span className="bg-red-600 text-white text-xs font-extrabold px-2 py-1 rounded">
                                -{p.discount}%
                              </span>
                            )}
                          </div>

                          <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              className="flex-1 border border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs py-2 rounded-lg flex items-center justify-center gap-2"
                              onClick={() =>
                                handleAddToCart(p?._id ?? p?.id, 1)
                              }
                            >
                              <FiShoppingCart /> THÊM VÀO GIỎ
                            </button>
                            <span
                              className={`text-[11px] font-extrabold px-3 py-1 rounded-full whitespace-nowrap ${
                                Number(p?.countInStock) <= 0
                                  ? "text-white bg-red-600"
                                  : "text-green-700 bg-green-100"
                              }`}
                            >
                              {Number(p?.countInStock) <= 0
                                ? "Hết hàng"
                                : "Còn hàng"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
