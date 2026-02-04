import React, { useEffect, useState } from "react";
import Logo from "../../assets/images/Logo.png";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";

import { settingsService } from "../../services";

const complianceBadge = (
  <div className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
    <span
      className="inline-block h-8 w-8 rounded-full bg-sky-600"
      aria-hidden="true"
    />
    <div className="leading-tight">
      <div className="text-xs font-bold text-sky-800">ĐÃ THÔNG BÁO</div>
      <div className="text-[11px] font-semibold text-sky-700">
        BỘ CÔNG THƯƠNG
      </div>
    </div>
  </div>
);

export default function Footer() {
  const year = new Date().getFullYear();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await settingsService.getSettings();
        if (mounted) setSettings(s);
      } catch {
        if (mounted) setSettings(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const footer = settings?.footer ?? {};
  const aboutText =
    footer?.aboutText ||
    "Trang thương mại chính thức của TechGearVN. Luôn tìm kiếm những sản phẩm PC, văn phòng chất lượng.";
  const addresses =
    Array.isArray(footer?.addresses) && footer.addresses.length
      ? footer.addresses
      : [
          "CS1: 83 - 85 Thái Hà - Đống Đa - HN",
          "CS2: Vinhomes - Phường 15 - Q9 - TP.HCM",
        ];
  const hotline = footer?.hotline || "098.655.2233";
  const email = footer?.email || "TechGearVN@gmail.com";
  const companyLine1 =
    footer?.companyLine1 ||
    "Bản quyền của Công ty cổ phần Mocato Việt Nam - Trụ sở: 248 Phú Viên, Bồ Đề, Long Biên, Hà Nội.";
  const companyLine2 =
    footer?.companyLine2 ||
    "GPDKKD: 0109787586 do Sở Kế Hoạch và Đầu Tư Hà Nội cấp ngày 22/10/2021";

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Về TTG */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <img
                src={Logo}
                alt="TTG Shop"
                className="h-12 w-auto object-contain"
              />
            </div>
            <h3 className="mb-3 text-base font-bold text-gray-900">
              Về TechGearVN
            </h3>
            <p className="text-sm leading-6 text-gray-600">{aboutText}</p>
          </section>

          {/* Thông tin liên hệ */}
          <section>
            <h3 className="mb-4 text-base font-bold text-gray-900">
              Thông tin liên hệ
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              {addresses.map((addr) => (
                <li key={addr} className="flex gap-3">
                  <FiMapPin className="mt-0.5 flex-shrink-0 text-gray-500" />
                  <span>{addr}</span>
                </li>
              ))}
              <li className="flex items-center gap-3">
                <FiPhone className="flex-shrink-0 text-gray-500" />
                <a
                  className="hover:text-red-600"
                  href={`tel:${String(hotline).replace(/\./g, "")}`}
                  aria-label={`Gọi hotline ${hotline}`}
                >
                  {hotline}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="flex-shrink-0 text-gray-500" />
                <a className="hover:text-red-600" href={`mailto:${email}`}>
                  {email}
                </a>
              </li>
            </ul>
          </section>

          {/* Tài khoản ngân hàng */}
          <section>
            <h3 className="mb-4 text-base font-bold text-gray-900">
              Tài Khoản Ngân Hàng
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="font-semibold">Tài Khoản Ngân Hàng</div>
              <a className="inline-block hover:text-red-600" href="#">
                Tìm kiếm Phương thức thanh toán
              </a>
              <div className="pt-2">
                {
                  <img
                    src="https://ttgshop.vn/static/assets/default/images/ttgshop-bct-1.png"
                    alt="Bộ Công Thương"
                    width={150}
                    height={50}
                  />
                }
              </div>
            </div>
          </section>

          {/* Chính sách */}
          <section>
            <h3 className="mb-4 text-base font-bold text-gray-900">
              Chính sách
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {[
                "Chính Sách Bảo Mật",
                "Quy Định Bảo Hành",
                "Chính Sách Đổi Trả",
                "Điều khoản sử dụng",
                "Chính sách vận chuyển & kiểm hàng",
                "Phần định trách nhiệm của tổ chức cung ứng dịch vụ logistics",
              ].map((label) => (
                <li key={label}>
                  <a className="hover:text-red-600" href="#">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="bg-gray-100">
        <div className="container mx-auto px-4 py-4 text-center text-xs text-gray-600">
          <div>
            Copyright © {year} {companyLine1}
          </div>
          <div>{companyLine2}</div>
        </div>
      </div>
    </footer>
  );
}
