import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

// Import CSS của Swiper
import "swiper/css";
import "swiper/css/pagination";

import "./swiper-custom.css";

const BannerSlider = () => {
  // 1. Dữ liệu cho SLIDER LỚN Ở TRÊN
  const mainSlides = [
    {
      id: 1,
      image:
        "https://ttgshop.vn/media/banner/ttgshop-banner-slider-top-27122025-1.png",
      alt: "PC Gaming Khủng",
    },
    {
      id: 2,
      image:
        "https://cdn.hstatic.net/files/200000722513/file/gearvn-laptop-gaming-sub-banner-t1-26.png",
      alt: "Laptop Gaming Deal Sốc",
    },
    {
      id: 3,
      image:
        "https://cdn.hstatic.net/files/200000722513/file/gearvn-build-pc-sub-banner-t1-26.png",
      alt: "Gear xịn giá tốt",
    },
  ];

  // 2. Dữ liệu cho 3 BANNER Ở DƯỚI
  const subBanners = [
    {
      id: 1,
      image:
        "https://ttgshop.vn/media/banner/ttgshop-banner-under-slider-top-27122025-1.png",
      alt: "Màn hình Gaming",
    },
    {
      id: 2,
      image:
        "https://ttgshop.vn/media/banner/ttgshop-banner-under-slider-top-27122025-2.png",
      alt: "Build PC tặng quà",
    },
    {
      id: 3,
      image:
        "https://ttgshop.vn/media/banner/ttgshop-banner-under-slider-top-27122025-3.png", // Tạm dùng lại ảnh demo
      alt: "Laptop văn phòng",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex flex-col gap-4">
        {/* --- PHẦN 1: SLIDER CHÍNH (Banner bự ở trên) --- */}
        <div className="w-full rounded-xl overflow-hidden shadow-lg group">
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={0}
            slidesPerView={1}
            autoplay={{ delay: 4000, disableOnInteraction: false }} // Chạy mỗi 4s
            loop={true}
            pagination={{ clickable: true }}
            className="w-full banner-swiper"
          >
            {mainSlides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <div className="w-full aspect-[21/9] md:aspect-[3/1] lg:aspect-[3.5/1]">
                  {/* Dùng aspect-ratio để giữ khung hình đẹp trên mọi thiết bị */}
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* --- PHẦN 2: 3 BANNER Ở DƯỚI --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subBanners.map((banner) => (
            <div
              key={banner.id}
              className="rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <img
                src={banner.image}
                alt={banner.alt}
                className="w-full h-full object-cover min-h-[150px]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BannerSlider;
