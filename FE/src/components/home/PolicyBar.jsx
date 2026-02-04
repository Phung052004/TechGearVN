import React from "react";
import { FiTruck, FiShield, FiRefreshCw, FiHeadphones } from "react-icons/fi";

const PolicyBar = () => {
  const policies = [
    {
      icon: <FiTruck size={28} />,
      title: "Giao hàng toàn quốc",
      desc: "Miễn phí vận chuyển đơn > 2tr",
    },
    {
      icon: <FiShield size={28} />,
      title: "Bảo hành chính hãng",
      desc: "Cam kết 100% chính hãng",
    },
    {
      icon: <FiRefreshCw size={28} />,
      title: "Đổi trả dễ dàng",
      desc: "1 đổi 1 trong 15 ngày đầu",
    },
    {
      icon: <FiHeadphones size={28} />,
      title: "Hỗ trợ 24/7",
      desc: "Tư vấn kỹ thuật nhiệt tình",
    },
  ];

  return (
    <div className="container mx-auto px-4 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {policies.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm md:text-base">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PolicyBar;
