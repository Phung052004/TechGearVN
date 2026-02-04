import React, { useEffect, useState } from "react";
import BannerSlider from "../../components/home/BannerSlider"; // Import Slider
import PolicyBar from "../../components/home/PolicyBar"; // Import Policy
import DailyDeals from "../../components/home/DailyDeals";
import ProductCategorySection from "../../components/home/ProductCategorySection"; // <--- Import Component Mới
import FloatingButtons from "../../components/common/FloatingButtons"; // <--- Import Component
import CommitmentSection from "../../components/home/CommitmentSection"; // <--- Import

import { categoryService } from "../../services";

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [catError, setCatError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        setCatError(null);
        const list = await categoryService.getCategories();
        if (!isMounted) return;
        setCategories(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!isMounted) return;
        setCatError(
          err?.response?.data?.message ||
            err?.message ||
            "Không tải được danh mục",
        );
        setCategories([]);
      }
    }

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <BannerSlider />
      <PolicyBar />
      <DailyDeals />

      {catError ? (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {catError}
          </div>
        </div>
      ) : null}

      {categories.map((c) => (
        <ProductCategorySection
          key={c?._id ?? c?.slug ?? c?.name}
          title={String(c?.name ?? "Danh mục").toUpperCase()}
          category={c?.slug ?? c?.name}
          link={
            c?.slug
              ? `/products?category=${encodeURIComponent(c.slug)}`
              : "/products"
          }
        />
      ))}

      <CommitmentSection />
      <FloatingButtons />
    </div>
  );
};

export default HomePage;
