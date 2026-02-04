import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { FiShoppingCart, FiPhone, FiTruck } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Navigation, Mousewheel } from "swiper/modules";
import { toast } from "react-toastify";
import { productService } from "../../services";
import { useCart } from "../../context";
import { FALLBACK_PRODUCT_IMAGE } from "../../constants/images";
import "swiper/css";
import "swiper/css/navigation";

const ProductCategorySection = ({
  title,
  category,
  subCategories = [],
  products,
  link = "/products",
  limit = 10,
}) => {
  const swiperRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();

  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const rafRef = useRef(null);

  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const productsLength = Array.isArray(products) ? products.length : 0;
  const subCategoriesKey = Array.isArray(subCategories)
    ? subCategories.join(",")
    : "";

  // Hàm format tiền tệ
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Swiper đôi khi không tự cập nhật khi list sản phẩm thay đổi (load async)
  useEffect(() => {
    if (!swiperRef.current) return;
    swiperRef.current.update();
  }, [productsLength, fetchedProducts.length]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!category && subCategories.length === 0) return;

      try {
        setIsLoading(true);
        setError(null);

        const params = {};
        // Prefer real database category when provided.
        if (category) {
          params.category = category;
        } else if (Array.isArray(subCategories) && subCategories.length > 0) {
          // Legacy support: match subCategory strings
          params.subCategories = subCategories.join(",");
        }

        const list = await productService.getProducts(params);

        if (!isMounted) return;
        setFetchedProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không tải được dữ liệu sản phẩm",
        );
        setFetchedProducts([]);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    // If parent passed products explicitly, don't auto-fetch.
    if (productsLength > 0) return;

    load();
    return () => {
      isMounted = false;
    };
  }, [category, productsLength, subCategoriesKey]);

  const displayProducts = useMemo(() => {
    const list =
      productsLength > 0 && Array.isArray(products)
        ? products
        : fetchedProducts;
    const max = Number(limit);
    if (Number.isFinite(max) && max > 0) return list.slice(0, max);
    return list;
  }, [products, productsLength, fetchedProducts, limit]);

  const productById = useMemo(() => {
    const map = new Map();
    for (const p of displayProducts) map.set(p?._id ?? p?.id, p);
    return map;
  }, [displayProducts]);

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

    const OFFSET = 14;
    const TOOLTIP_W = 340;
    const TOOLTIP_H = 260;

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
          <div className="bg-orange-500 text-white font-extrabold p-3 leading-snug line-clamp-2">
            {hoveredProduct.name}
          </div>
          <div className="p-3">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-bold text-gray-700">Giá:</div>
              <div className="text-lg font-black text-red-600">
                {formatPrice(hoveredProduct.price)}
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-800 line-clamp-4">
              {hoveredProduct.description ||
                `Phân loại: ${hoveredProduct.subCategory || "-"}`}
            </div>
            <div className="mt-3 text-xs text-gray-600">
              Tồn kho: {Number(hoveredProduct.countInStock) || 0}
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

  async function handleAddToCart(productId) {
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
    <div className="container mx-auto px-4 mb-8">
      {renderHoverTooltip()}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* --- HEADER SECTION --- */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Left: title + separator + shipping text */}
            <div className="flex items-center gap-4 flex-wrap min-w-0">
              <h2 className="text-2xl font-extrabold text-gray-900 whitespace-nowrap">
                {title}
              </h2>
              <span className="text-gray-300 select-none">|</span>
              <div className="flex items-center gap-2 font-bold text-gray-900 whitespace-nowrap">
                <FiTruck className="text-red-500" />
                Miễn phí giao hàng
              </div>
            </div>

            {/* Right: sub categories + view all */}
            <div className="flex items-center justify-between lg:justify-end gap-4">
              {subCategories.length > 0 && (
                <nav className="flex items-center gap-6 overflow-x-auto whitespace-nowrap">
                  {subCategories.map((sub, index) => (
                    <Link
                      key={index}
                      to="/products"
                      className="text-sm font-bold text-gray-900 hover:text-blue-600 uppercase"
                    >
                      {sub}
                    </Link>
                  ))}
                </nav>
              )}

              <Link
                to={link}
                className="text-sm font-bold text-blue-600 hover:underline whitespace-nowrap"
              >
                Xem tất cả
              </Link>
            </div>
          </div>
        </div>

        {/* --- BODY: PRODUCT SLIDER --- */}
        <div className="p-4">
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm font-medium">
              {error}
            </div>
          )}

          {isLoading && displayProducts.length === 0 && (
            <div className="py-8 text-center text-gray-500 font-medium">
              Đang tải sản phẩm...
            </div>
          )}

          {!isLoading && !error && displayProducts.length === 0 && (
            <div className="py-8 text-center text-gray-500 font-medium">
              Chưa có sản phẩm.
            </div>
          )}

          <Swiper
            modules={[Navigation, Mousewheel]}
            spaceBetween={15}
            slidesPerView={1}
            navigation
            grabCursor
            simulateTouch
            allowTouchMove
            mousewheel={{ forceToAxis: true }}
            observer
            observeParents
            observeSlideChildren
            breakpoints={{
              640: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
              1280: { slidesPerView: 5 },
            }}
            className="pb-2"
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
          >
            {displayProducts.map((product) => (
              <SwiperSlide key={product?._id ?? product?.id}>
                <div
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-xl transition-all duration-300 h-full flex flex-col group relative overflow-hidden"
                  onMouseEnter={() =>
                    setHoveredProductId(product?._id ?? product?.id)
                  }
                  onMouseMove={onCardMouseMove}
                  onMouseLeave={() => setHoveredProductId(null)}
                >
                  {/* Ảnh sản phẩm */}
                  <Link
                    to={`/product/${product?._id ?? product?.id}`}
                    className="block p-4 overflow-hidden relative"
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
                    {/* Hết hàng Overlay */}
                    {Number(product.countInStock) <= 0 && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded">
                          HẾT HÀNG
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Thông tin */}
                  <div className="p-3 flex flex-col flex-grow">
                    <Link
                      to={`/product/${product?._id ?? product?.id}`}
                      className="text-sm font-bold text-gray-900 line-clamp-2 hover:text-orange-600 mb-2 min-h-[40px]"
                    >
                      {product.name}
                    </Link>

                    {/* Giá tiền */}
                    <div className="mt-auto flex items-end justify-between gap-2">
                      <div>
                        <div className="text-red-600 font-extrabold text-lg">
                          {formatPrice(product.price)}
                        </div>
                        <div className="text-gray-400 text-xs line-through min-h-[16px]">
                          {Number(product.oldPrice) > Number(product.price)
                            ? formatPrice(product.oldPrice)
                            : "\u00A0"}
                        </div>
                      </div>

                      {/* Discount badge on the right (like screenshot) */}
                      {product.discount > 0 && (
                        <span className="bg-red-600 text-white text-xs font-extrabold px-2 py-1 rounded-md">
                          -{product.discount}%
                        </span>
                      )}
                    </div>

                    {/* Nút hành động */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      {Number(product.countInStock) <= 0 ? (
                        // Nút Liên hệ khi hết hàng (Giống ảnh Linh kiện)
                        <button className="flex-1 bg-white hover:bg-gray-50 text-gray-900 text-xs font-extrabold py-2 px-2 rounded-md border border-gray-200 flex items-center justify-center gap-2 transition-colors">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-800 text-white">
                            <FiPhone />
                          </span>
                          LIÊN HỆ
                        </button>
                      ) : (
                        // Nút Thêm vào giỏ khi còn hàng
                        <button
                          type="button"
                          className="group relative flex-1 bg-white text-gray-900 text-xs font-bold py-2 px-2 rounded-md border border-gray-200 flex items-center justify-center gap-2 overflow-hidden"
                          onClick={() =>
                            handleAddToCart(product?._id ?? product?.id)
                          }
                        >
                          {/* slide overlay */}
                          <span className="absolute inset-0 bg-blue-800 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />

                          <span className="relative z-10 inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-800 text-white group-hover:bg-white group-hover:text-blue-800 transition-colors">
                            <FiShoppingCart />
                          </span>
                          <span className="relative z-10 group-hover:text-white transition-colors">
                            THÊM VÀO GIỎ
                          </span>
                        </button>
                      )}

                      <span
                        className={`text-[11px] font-extrabold px-3 py-1 rounded-full whitespace-nowrap ${
                          Number(product.countInStock) <= 0
                            ? "text-white bg-red-600"
                            : "text-green-700 bg-green-100"
                        }`}
                      >
                        {Number(product.countInStock) <= 0
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
    </div>
  );
};

export default ProductCategorySection;
