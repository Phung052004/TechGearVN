import React, { useState } from "react";
import {
  FiTruck,
  FiRefreshCw,
  FiCreditCard,
  FiHeadphones,
  FiPlus,
  FiMinus,
} from "react-icons/fi";

const CommitmentSection = () => {
  // State để quản lý việc mở/đóng các câu hỏi (Accordion)
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Dữ liệu cho phần Policy (4 icon ở trên)
  const policies = [
    {
      icon: <FiTruck size={40} />,
      title: "GIAO HÀNG TOÀN QUỐC",
      desc: "Giao hàng trước, trả tiền sau COD",
    },
    {
      icon: <FiRefreshCw size={40} />,
      title: "ĐỔI TRẢ DỄ DÀNG",
      desc: "Đổi mới trong 30 ngày đầu",
    },
    {
      icon: <FiCreditCard size={40} />,
      title: "THANH TOÁN TIỆN LỢI",
      desc: "Trả tiền mặt, chuyển khoản, trả góp 0%",
    },
    {
      icon: <FiHeadphones size={40} />,
      title: "HỖ TRỢ NHIỆT TÌNH",
      desc: "Tư vấn tổng đài miễn phí 24/7",
    },
  ];

  // Dữ liệu cho phần Câu hỏi (Accordion)
  const faqItems = [
    {
      id: 1,
      question: "1. Liên hệ chăm sóc khách hàng dễ dàng",
      content: (
        <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
          <p>
            Bạn đang cần hỗ trợ hay cần đóng góp ý kiến cho{" "}
            <strong className="text-gray-800">TechGear Vietnam</strong> trong
            quá trình mua hàng. Hãy liên hệ với chúng tôi bất cứ khi nào 24/7
            qua số Hotline hoặc dịch vụ Chat trực tuyến miễn phí. Chúng tôi sẽ
            cung cấp giải pháp hỗ trợ quý khách các vấn đề liên quan đến sản
            phẩm nhanh nhất có thể.
          </p>
          <p>
            Hotline chăm sóc và hỗ trợ khách mua hàng (chỉ hoạt động trong giờ
            hành chính): <strong className="text-red-600">1900.1234</strong>
          </p>
          <p>
            Ngoài ra khách hàng có thể liên hệ thông qua rất nhiều kênh khác
            nhau như: Email, Chat, Để lại đánh giá, bình luận ở các kênh mạng xã
            hội.
          </p>
          <p>
            Fanpage:{" "}
            <a href="#" className="text-blue-600 hover:underline">
              https://www.facebook.com/techgearvn
            </a>
          </p>
        </div>
      ),
    },
    {
      id: 2,
      question: "2. Giao hàng nhanh trong 2 giờ mà không thu thêm phí",
      content:
        "Áp dụng cho các đơn hàng nội thành TP.HCM và Hà Nội. Đội ngũ giao hàng chuyên nghiệp của TechGear sẽ đảm bảo sản phẩm đến tay bạn nhanh nhất và an toàn nhất.",
    },
    {
      id: 3,
      question:
        "3. Miễn phí lên đời và trải nghiệm sản phẩm trong vòng 15 ngày",
      content:
        "Khách hàng được dùng thử sản phẩm trong 15 ngày, nếu không ưng ý có thể đổi sang sản phẩm khác có giá trị bằng hoặc cao hơn mà không mất phí khấu hao.",
    },
    {
      id: 4,
      question:
        "4. Cam kết thu cũ đổi mới trọn đời với tất cả các sản phẩm Gaming Gear và linh kiện máy tính",
      content:
        "TechGear hỗ trợ thu lại linh kiện cũ của bạn với giá tốt nhất thị trường để bạn dễ dàng nâng cấp lên đời máy mới.",
    },
    {
      id: 5,
      question:
        "5. Cho mượn sản phẩm miễn phí thay thế trong thời gian bảo hành tại TechGear",
      content:
        "Trong thời gian chờ bảo hành, chúng tôi sẽ cho bạn mượn sản phẩm tương đương để công việc và giải trí không bị gián đoạn.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-10">
      {/* --- PHẦN 1: 4 CAM KẾT (ICONS) --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {policies.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="text-red-500 mb-4">
                {React.cloneElement(item.icon, { size: 34 })}
              </div>
              <h3 className="font-bold text-gray-900 text-sm uppercase mb-1">
                {item.title}
              </h3>
              <p className="text-sm text-gray-700">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* --- PHẦN 2: TIÊU ĐỀ & ACCORDION --- */}
      <div className="w-full">
        {/* Tiêu đề */}
        <div className="text-center mb-8">
          <p className="text-gray-700 font-semibold">
            Trải nghiệm mua sắm tại{" "}
            <span className="text-orange-500 font-bold">TechGearVN SHOP</span>
          </p>
          <h2 className="text-4xl  font-bold text-gray-900 mt-2">
            Cam Kết 100% <span className="text-orange-500">Hài Lòng</span>
          </h2>
        </div>

        {/* Accordion List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 ">
          {faqItems.map((item, index) => (
            <div
              key={item.id}
              className="border-b border-gray-100 last:border-0"
            >
              <button
                className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition-colors duration-200"
                onClick={() => toggleAccordion(index)}
              >
                <span className="font-bold text-sm md:text-base text-gray-900">
                  {item.question}
                </span>
                <span className="text-gray-900">
                  {activeIndex === index ? (
                    <FiMinus size={22} />
                  ) : (
                    <FiPlus size={22} />
                  )}
                </span>
              </button>

              {/* Nội dung xổ xuống */}
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  activeIndex === index
                    ? "max-h-[500px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-6 text-gray-700 text-sm">
                  {item.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommitmentSection;
