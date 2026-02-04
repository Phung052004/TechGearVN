import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiClock, FiMap, FiMapPin, FiPhoneCall } from "react-icons/fi";

const Navbar = () => {
  const navigate = useNavigate();

  const UI = {
    barPaddingY: "py-3",
    barPaddingX: "px-4",
    sectionGap: "gap-6",
    leftBlockGap: "gap-10",
    pillsGap: "gap-3",
    pillPadding: "px-4 py-2",
    pillText: "text-sm",
    centerLinksGap: "gap-6",
    centerLinksText: "text-sm",
    separator: "ml-2 pl-6 border-l border-white/15",
  };

  const [showShowroom, setShowShowroom] = useState(false);

  const readAuthFromStorage = () => {
    const token = localStorage.getItem("token");
    let user = null;

    try {
      user = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      user = null;
    }

    return {
      token,
      user,
      isLoggedIn: Boolean(token),
    };
  };

  const [auth, setAuth] = useState(() => readAuthFromStorage());

  useEffect(() => {
    const syncAuth = () => setAuth(readAuthFromStorage());

    // "storage" only fires across tabs; "auth:changed" covers same-tab updates.
    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth:changed", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth:changed", syncAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth:changed"));
    navigate("/");
  };

  const showrooms = useMemo(
    () => [
      {
        number: "01",
        title: "CHI NHÁNH ĐỐNG ĐA - HÀ NỘI",
        address: "83-85 Thái Hà, Trung Liệt, Đống Đa, Hà Nội",
        phone: "036.625.8142",
        hours: "Từ 8h30–20h00 hàng ngày",
      },
      {
        number: "02",
        title: "CHI NHÁNH QUẬN 10 - HỒ CHÍ MINH",
        address: "83A Cửu Long, Phường 15, Quận 10, TP Hồ Chí Minh",
        phone: "098.668.0497",
        hours: "Từ 8h30–20h00 hàng ngày",
      },
    ],
    [],
  );

  const navLinkClass = ({ isActive }) =>
    `${UI.centerLinksText} font-semibold transition-colors ${
      isActive ? "text-white" : "text-gray-200 hover:text-white"
    }`;

  return (
    <header className="bg-[#06363b] text-white sticky top-0 z-50 shadow-lg">
      <div className="relative" onMouseLeave={() => setShowShowroom(false)}>
        <div
          className={`container mx-auto ${UI.barPaddingX} ${UI.barPaddingY} flex items-center ${UI.sectionGap}`}
        >
          {/* Left + center */}
          <div className={`flex items-center ${UI.leftBlockGap}`}>
            {/* Pills */}
            <div className={`flex items-center ${UI.pillsGap}`}>
              <button
                type="button"
                className={`animate-color-shift-2s rounded-full ${UI.pillPadding} ${UI.pillText} font-semibold`}
                onMouseEnter={() => setShowShowroom(true)}
                onClick={() => setShowShowroom((v) => !v)}
              >
                <span className="inline-flex items-center gap-2">
                  <FiMapPin />
                  Hệ thống showroom
                </span>
              </button>

              <button
                type="button"
                className={`animate-color-shift-2s rounded-full ${UI.pillPadding} ${UI.pillText} font-semibold`}
              >
                <span className="inline-flex items-center gap-2">
                  <FiPhoneCall />
                  Bán hàng trực tuyến
                </span>
              </button>
            </div>

            {/* Center links */}
            <nav
              className={`hidden md:flex items-center ${UI.centerLinksGap} ${UI.separator}`}
            >
              <NavLink to="/" className={navLinkClass}>
                Trang tin công nghệ
              </NavLink>
              <NavLink to="/build-pc" className={navLinkClass}>
                Tư vấn build PC
              </NavLink>
              <NavLink to="/" className={navLinkClass}>
                Phần mềm hay
              </NavLink>
            </nav>
          </div>

          {/* Auth */}
          <div className="ml-auto flex items-center gap-2 text-sm font-semibold">
            {auth.isLoggedIn ? (
              <>
                <Link to="/profile">Tài khoản</Link>
                <span>|</span>
                <button type="button" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/register">Đăng ký</Link>
                <span>|</span>
                <Link to="/login">Đăng nhập</Link>
              </>
            )}
          </div>
        </div>

        {/* Dropdown showroom */}
        {showShowroom && (
          <div
            className="absolute left-0 right-0 top-full"
            onMouseEnter={() => setShowShowroom(true)}
          >
            <div className="container mx-auto px-4 pt-3">
              <div className="bg-white text-gray-900 rounded-xl shadow-xl p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {showrooms.map((s) => (
                    <div
                      key={s.number}
                      className="rounded-xl border border-gray-100 overflow-hidden"
                    >
                      <div className="flex">
                        <div className="bg-secondary text-white font-bold px-4 py-3 flex items-center">
                          {s.number}
                        </div>
                        <div className="flex-1 bg-[#0b4950] text-white px-4 py-3 font-bold">
                          {s.title}
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="flex gap-3">
                          <FiMapPin />
                          <span>{s.address}</span>
                        </div>
                        <div className="flex gap-3">
                          <FiPhoneCall />
                          <span>{s.phone}</span>
                        </div>
                        <div className="flex gap-3">
                          <FiClock />
                          <span>{s.hours}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
