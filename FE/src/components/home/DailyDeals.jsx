import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import {
  FiShoppingCart,
  FiChevronRight,
  FiCheckCircle,
  FiGift,
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { productService } from "../../services";
import { toast } from "react-toastify";
import { useCart } from "../../context";
import { FALLBACK_PRODUCT_IMAGE } from "../../constants/images";

// Import CSS Swiper
import "swiper/css";
import "swiper/css/navigation";

import "./dailydeals-swiper.css";

const DailyDeals = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();

  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const rafRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDeals() {
      try {
        setError(null);
        const all = await productService.getProducts();
        if (!isMounted) return;

        const list = Array.isArray(all) ? all : [];

        // Prefer discounted products; if none, just show newest/first items.
        const discounted = list
          .filter((p) => (Number(p?.discount) || 0) > 0)
          .sort(
            (a, b) => (Number(b?.discount) || 0) - (Number(a?.discount) || 0),
          );

        const finalList = (discounted.length ? discounted : list).slice(0, 12);
        setProducts(finalList);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err?.response?.data?.message || err?.message || "Không tải được deal",
        );
        setProducts([]);
      }
    }

    loadDeals();
    return () => {
      isMounted = false;
    };
  }, []);

  // Hàm format tiền tệ (VND)
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const productById = useMemo(() => {
    const map = new Map();
    for (const p of products) map.set(p?._id ?? p?.id, p);
    return map;
  }, [products]);

  const hoveredProduct = hoveredProductId
    ? productById.get(hoveredProductId)
    : null;

  const onCardMouseMove = (event) => {
    if (rafRef.current) return;
    const { clientX, clientY } = event;
    rafRef.current = requestAnimationFrame(() => {
      setCursorPos({ x: clientX, y: clientY });
      rafRef.current = null;
    });
  };

  const renderHoverTooltip = () => {
    if (!hoveredProduct) return null;

    // Desired: show to the right/bottom of cursor; keep inside viewport.
    const OFFSET = 14;
    const TOOLTIP_W = 360;
    const TOOLTIP_H = 420;

    const vw = typeof window !== "undefined" ? window.innerWidth : 0;
    const vh = typeof window !== "undefined" ? window.innerHeight : 0;

    let left = cursorPos.x + OFFSET;
    let top = cursorPos.y + OFFSET;

    if (vw) {
      if (left + TOOLTIP_W > vw - 8)
        left = Math.max(8, cursorPos.x - OFFSET - TOOLTIP_W);
      left = Math.max(8, Math.min(left, vw - TOOLTIP_W - 8));
    }

    if (vh) {
      if (top + TOOLTIP_H > vh - 8)
        top = Math.max(8, cursorPos.y - OFFSET - TOOLTIP_H);
      top = Math.max(8, Math.min(top, vh - TOOLTIP_H - 8));
    }

    return createPortal(
      <div
        className="hidden md:block fixed z-[9999] pointer-events-none"
        style={{ left, top, width: TOOLTIP_W }}
      >
        <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
          <div className="bg-orange-500 text-white font-extrabold p-4 leading-snug">
            {hoveredProduct.name}
          </div>

          <div className="p-4">
            <div className="flex items-baseline gap-3">
              <div className="text-sm font-bold text-gray-900">Giá bán:</div>
              <div className="text-xl font-black text-red-600">
                {formatPrice(hoveredProduct.price)}
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-3">
              <div className="text-sm font-bold text-gray-900">Danh mục:</div>
              <div className="text-sm text-gray-800">
                {typeof hoveredProduct.category === "string"
                  ? hoveredProduct.category
                  : (hoveredProduct.category?.name ??
                    hoveredProduct.category?.slug ??
                    "-")}
              </div>
            </div>

            {hoveredProduct.description ? (
              <>
                <div className="mt-4 inline-flex items-center bg-orange-500 text-white font-extrabold px-4 py-2 rounded">
                  Mô tả:
                </div>
                <div className="mt-3 text-sm text-gray-900 max-h-[210px] overflow-hidden leading-snug">
                  {hoveredProduct.description}
                </div>
              </>
            ) : (
              <>
                <div className="mt-4 inline-flex items-center bg-orange-500 text-white font-extrabold px-4 py-2 rounded">
                  Thông tin:
                </div>
                <ul className="mt-3 space-y-2 text-sm text-gray-900 max-h-[210px] overflow-hidden">
                  <li className="flex gap-2">
                    <FiCheckCircle className="mt-0.5 text-emerald-600 flex-shrink-0" />
                    <span className="leading-snug">
                      Tồn kho: {Number(hoveredProduct.countInStock) || 0}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <FiCheckCircle className="mt-0.5 text-emerald-600 flex-shrink-0" />
                    <span className="leading-snug">
                      Phân loại: {hoveredProduct.subCategory || "-"}
                    </span>
                  </li>
                </ul>
              </>
            )}

            <div className="mt-4 inline-flex items-center gap-2 bg-orange-500 text-white font-extrabold px-4 py-2 rounded">
              <FiGift /> Khuyến mãi:
            </div>
            <div className="mt-2 text-sm text-gray-900">
              {(Number(hoveredProduct.discount) || 0) > 0
                ? `Giảm ${hoveredProduct.discount}%`
                : "Không có"}
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  };

  async function ensureLoggedIn() {
    const token = localStorage.getItem("token");
    if (token) return true;
    toast.info("Vui lòng đăng nhập để thêm vào giỏ hàng");
    navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
    return false;
  }

  async function handleAddToCart(product) {
    const productId = product?._id ?? product?.id;
    if (!productId) return;
    const inStock = Number(product?.countInStock ?? 0) > 0;
    if (!inStock) {
      toast.info("Sản phẩm đã hết hàng");
      return;
    }

    const ok = await ensureLoggedIn();
    if (!ok) return;

    try {
      await addItem({ productId, quantity: 1 });
      toast.success("Đã thêm vào giỏ hàng");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không thêm vào giỏ được",
      );
    }
  }

  return (
    <section className="w-full">
      <div className="container mx-auto px-4 mb-8">
        <div className="rounded-2xl overflow-hidden shadow-xl bg-[url('https://ttgshop.vn/static/assets/default/images/ttgshop-collection-bg-1.jpg')] bg-cover bg-center">
          <div className="p-4 md:p-6">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <img
                src="https://ttgshop.vn/static/assets/default/images/ttgshop-collection-title-1.png"
                alt="Deal HOT mỗi ngày - Khuyến mãi liền tay"
                className="w-full md:w-auto max-w-[820px] h-auto"
                loading="lazy"
              />

              <div className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-md shadow-md">
                HOT SALE
              </div>
            </div>

            {/* --- BODY: SLIDER SẢN PHẨM --- */}
            <div className="mt-5">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <Swiper
                modules={[Navigation, Autoplay]}
                spaceBetween={18} // Khoảng cách giữa các thẻ
                slidesPerView={1} // Mặc định mobile 1 cột
                navigation
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                breakpoints={{
                  640: { slidesPerView: 2 }, // Tablet nhỏ 2 cột
                  768: { slidesPerView: 3 }, // Tablet lớn 3 cột
                  1024: { slidesPerView: 4 }, // Desktop 4 cột
                  1280: { slidesPerView: 5 }, // Màn hình lớn 5 cột
                }}
                className="dailydeals-swiper pb-10"
              >
                {products.map((product) => (
                  <SwiperSlide key={product?._id ?? product?.id}>
                    <div
                      className="relative group"
                      onMouseEnter={() =>
                        setHoveredProductId(product?._id ?? product?.id)
                      }
                      onMouseMove={onCardMouseMove}
                      onMouseLeave={() => setHoveredProductId(null)}
                    >
                      {/* --- PRODUCT CARD --- */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden">
                        {/* Ảnh sản phẩm */}
                        <Link
                          to={`/product/${product?._id ?? product?.id}`}
                          className="block p-4 overflow-hidden"
                        >
                          <img
                            src={product.thumbnail ?? product.image}
                            alt={product.name}
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                            className="w-full h-44 object-contain transform group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                            }}
                          />
                        </Link>

                        {/* Thông tin */}
                        <div className="p-3 flex flex-col flex-grow">
                          {/* Tên SP */}
                          <Link
                            to={`/product/${product?._id ?? product?.id}`}
                            className="text-sm font-bold text-gray-900 line-clamp-2 hover:text-blue-600 mb-2 min-h-[40px]"
                          >
                            {product.name}
                          </Link>

                          {/* Giá */}
                          <div className="mt-auto flex items-end justify-between gap-2">
                            <div>
                              <div className="text-red-600 font-extrabold text-lg">
                                {formatPrice(product.price)}
                              </div>
                              <div className="text-gray-400 text-xs line-through font-medium min-h-[16px]">
                                {Number(product.oldPrice) >
                                Number(product.price)
                                  ? formatPrice(product.oldPrice)
                                  : "\u00A0"}
                              </div>
                            </div>

                            {(Number(product.discount) || 0) > 0 && (
                              <span className="bg-red-600 text-white text-xs font-extrabold px-2 py-1 rounded-md">
                                -{product.discount}%
                              </span>
                            )}
                          </div>

                          {/* Nút hành động */}
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              className="flex-1 bg-white hover:bg-gray-50 text-gray-900 text-xs font-extrabold py-2 px-2 rounded-md border border-gray-200 flex items-center justify-center gap-2 transition-colors"
                              onClick={() => handleAddToCart(product)}
                            >
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-800 text-white">
                                <FiShoppingCart />
                              </span>
                              THÊM VÀO GIỎ
                            </button>
                            <span className="text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap text-green-700 bg-green-100">
                              {Number(product.countInStock) <= 0
                                ? "Hết hàng"
                                : "Còn hàng"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {renderHoverTooltip()}

              {/* Nút Xem tất cả (Footer) */}
              <div className="text-center mt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-7 py-2.5 rounded-full font-bold shadow-md transition-all hover:scale-105"
                >
                  Xem tất cả <FiChevronRight className="text-lg" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DailyDeals;
