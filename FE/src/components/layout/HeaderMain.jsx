import React, { useMemo } from "react";
import Logo from "../../assets/images/Logo.png";
import { Link } from "react-router-dom";
import {
  FiBox,
  FiSearch,
  FiShoppingCart,
  FiPhoneCall,
  FiMonitor,
  FiMenu,
  FiChevronDown,
  FiChevronRight,
  FiCpu,
  FiZap,
  FiBriefcase,
  FiPackage,
} from "react-icons/fi"; // Nhớ cài: npm install react-icons

import { useCart } from "../../context";

const HeaderMain = () => {
  const { cart } = useCart();

  const cartCount = useMemo(() => {
    const items = Array.isArray(cart?.items) ? cart.items : [];
    return items.reduce((sum, it) => sum + Number(it?.quantity ?? 0), 0);
  }, [cart]);

  const topCategories = [
    { name: "PC GAMING", Icon: FiZap },
    { name: "PC WORKSTATION", Icon: FiCpu },
    { name: "PC AMD GAMING", Icon: FiZap },
    { name: "PC MINI", Icon: FiBox },
    { name: "PC VĂN PHÒNG", Icon: FiBriefcase },
  ];

  const productMenu = [
    { label: "PC Gaming", href: "/products", Icon: FiZap },
    { label: "PC Workstation", href: "/products", Icon: FiCpu },
    { label: "Laptop", href: "/products", Icon: FiMonitor },
    { label: "Linh kiện", href: "/products", Icon: FiPackage },
    { label: "Phụ kiện", href: "/products", Icon: FiBox },
  ];

  return (
    <div className="bg-white py-4 shadow-sm">
      <div className="container mx-auto px-4">
        {/* --- DÒNG 1: LOGO - SEARCH - ACTIONS --- */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4">
          {/* 1. Logo */}
          <Link to="/" className="flex-shrink-0">
            {/* Bạn thay bằng thẻ img sau này */}
            <img
              src={Logo}
              alt="TechGear Logo"
              className="h-32 w-auto object-contain"
            />
          </Link>

          {/* 2. Search Bar (Giống mẫu) */}
          <div className="flex-1 w-full max-w-2xl">
            <div className="flex border-2 border-red-600 rounded-md overflow-hidden">
              {/* Dropdown danh mục giả lập */}
              <div className="hidden md:flex items-center bg-gray-100 px-3 border-r border-gray-300 text-sm text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap">
                Tất cả danh mục <FiChevronDown className="ml-1" />
              </div>

              {/* Input tìm kiếm */}
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="flex-1 px-4 py-2.5 outline-none text-gray-700"
              />

              {/* Nút tìm kiếm */}
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 flex items-center justify-center transition-colors">
                <FiSearch size={20} />
              </button>
            </div>
            {/* Gợi ý nhỏ dưới thanh search */}
            <div className="hidden md:flex gap-3 text-xs text-gray-500 mt-1 pl-1">
              <span className="cursor-pointer hover:text-red-600">
                PC Gaming
              </span>
              <span className="cursor-pointer hover:text-red-600">
                Linh kiện máy tính
              </span>
              <span className="cursor-pointer hover:text-red-600">
                Màn hình
              </span>
            </div>
          </div>

          {/* 3. Actions (Hotline, Build PC, Cart) */}
          <div className="flex items-center gap-4 xl:gap-6">
            {/* Hotline */}
            <div className="hidden xl:flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-red-600 flex items-center justify-center text-red-600">
                <FiPhoneCall size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Hotline mua hàng</span>
                <span className="font-bold text-gray-800">1900.1234</span>
              </div>
            </div>

            {/* Build PC */}
            <Link
              to="/build-pc"
              className="hidden lg:flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-red-50 flex items-center justify-center text-gray-600 group-hover:text-red-600 transition-colors">
                <FiMonitor size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Xây dựng</span>
                <span className="font-bold text-gray-800 group-hover:text-red-600 transition-colors">
                  Cấu hình PC
                </span>
              </div>
            </Link>

            {/* Giỏ hàng */}
            <Link
              to="/cart"
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-full transition-colors"
            >
              <div className="relative">
                <FiShoppingCart size={22} className="text-red-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-sm font-bold text-red-600 hidden sm:block">
                Giỏ hàng
              </span>
            </Link>
          </div>
        </div>

        {/* --- DÒNG 2: NAVIGATION BAR (DANH MỤC) --- */}
        <div className="flex items-center gap-6 mt-2 border-t border-gray-100 pt-3">
          {/* Nút Danh mục sản phẩm (Màu tối) */}
          <div className="relative group">
            <button
              type="button"
              className="bg-[#0b4950] text-white px-4 py-2.5 rounded flex items-center gap-2 font-bold text-sm cursor-pointer hover:bg-[#083a40] transition-colors"
            >
              <FiMenu size={20} />
              DANH MỤC SẢN PHẨM
              <FiChevronDown className="ml-1 opacity-90" />
            </button>

            {/* Dropdown menu (hover/focus) */}
            <div className="absolute left-0 top-full pt-2 z-50 invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-150">
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden w-[360px]">
                <div className="p-2">
                  {productMenu.map(({ label, href, Icon }) => (
                    <Link
                      key={label}
                      to={href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <span className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                        <Icon size={18} />
                      </span>
                      <span className="flex-1">{label}</span>
                      <FiChevronRight className="opacity-60" />
                    </Link>
                  ))}
                </div>

                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Nổi bật
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["PC Gaming", "Màn hình", "Bàn phím", "Chuột"].map((t) => (
                      <Link
                        key={t}
                        to="/products"
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-700 transition-colors"
                      >
                        {t}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* List Categories */}
          <nav className="hidden md:flex items-center gap-6 overflow-x-auto">
            {topCategories.map((item) => (
              <Link
                key={item.name}
                to="/products"
                className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-red-600 transition-colors whitespace-nowrap uppercase"
              >
                <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                  <item.Icon size={18} />
                </span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default HeaderMain;
