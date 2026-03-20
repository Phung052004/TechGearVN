import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context";
import { FaCogs, FaClipboardList, FaTruck } from "react-icons/fa";

export default function DashboardAccessCard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  const role = user?.role || "";

  // Không hiện cho khách hàng bình thường
  if (!role || role === "CUSTOMER") {
    return null;
  }

  const getDashboardInfo = () => {
    switch (role) {
      case "ADMIN":
        return {
          title: "Quản lý hệ thống",
          description: "Truy cập bảng điều khiển quản trị",
          icon: <FaCogs className="text-4xl" />,
          link: "/admin",
          bgColor: "from-purple-500 to-indigo-600",
          iconBg: "bg-purple-100",
          iconColor: "text-purple-600",
        };
      case "STAFF":
        return {
          title: "Dashboard nhân viên",
          description: "Quản lý đơn hàng & sản phẩm",
          icon: <FaClipboardList className="text-4xl" />,
          link: "/staff",
          bgColor: "from-blue-500 to-cyan-600",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
        };
      case "DELIVERY":
        return {
          title: "Quản lý giao hàng",
          description: "Xem danh sách đơn hàng cần giao",
          icon: <FaTruck className="text-4xl" />,
          link: "/staff/orders",
          bgColor: "from-green-500 to-emerald-600",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
        };
      default:
        return null;
    }
  };

  const info = getDashboardInfo();
  if (!info) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div
        className={`bg-gradient-to-r ${info.bgColor} rounded-2xl shadow-xl overflow-hidden text-white p-8 mb-8`}
      >
        <div className="flex items-center justify-between">
          {/* Left side - Text */}
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">{info.title}</h2>
            <p className="text-lg opacity-90 mb-6">{info.description}</p>
            <Link
              to={info.link}
              className="inline-block bg-white text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 shadow-lg"
            >
              Truy cập ngay →
            </Link>
          </div>

          {/* Right side - Icon */}
          <div
            className={`${info.iconBg} rounded-full p-6 hidden md:flex items-center justify-center ml-8`}
          >
            <div className={info.iconColor}>{info.icon}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
