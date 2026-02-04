import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookMessenger, FaTools } from "react-icons/fa"; // Icon Messenger và Công cụ
import { SiZalo } from "react-icons/si"; // Có thể dùng icon Zalo từ thư viện (nếu có) hoặc dùng ảnh

const FloatingButtons = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
      {/* 1. Nút Build PC (Trên cùng) */}
      <Link
        to="/build-pc"
        className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:scale-110 transition-transform duration-300 group cursor-pointer relative"
        title="Xây dựng cấu hình"
      >
        {/* Giả lập icon cờ lê + bánh răng giống ảnh bằng React Icons */}
        <div className="relative">
          <img
            src="https://ttgshop.vn/static/assets/default/images/ttgshop-float-icon-2.png"
            alt="bánh răng"
          />
        </div>

        {/* Tooltip khi hover */}
        <span className="absolute right-full mr-3 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Build PC
        </span>
      </Link>

      {/* 2. Nút Messenger (Giữa) */}
      <a
        href="https://m.me/TechGearVietnam" // Link Facebook Messenger của Shop
        target="_blank"
        rel="noreferrer"
        className="w-12 h-12 bg-[#0084FF] rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 group relative"
      >
        <FaFacebookMessenger className="text-white text-2xl" />
        {/* Tooltip */}
        <span className="absolute right-full mr-3 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Chat Facebook
        </span>
      </a>

      {/* 3. Nút Zalo (Dưới cùng) */}
      <a
        href="https://zalo.me/0986552233" // Link Zalo của Shop
        target="_blank"
        rel="noreferrer"
        className="w-12 h-12 bg-white rounded-full shadow-lg border border-blue-100 flex items-center justify-center hover:scale-110 transition-transform duration-300 group relative overflow-hidden"
      >
        {/* Vì React-icon không có icon Zalo chuẩn màu, ta dùng ảnh PNG logo Zalo */}
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/1200px-Icon_of_Zalo.svg.png"
          alt="Zalo"
          className="w-full h-full object-cover"
        />
        {/* Tooltip */}
        <span className="absolute right-full mr-3 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Chat Zalo
        </span>
      </a>
    </div>
  );
};

export default FloatingButtons;
