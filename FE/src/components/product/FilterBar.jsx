import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import Input from "../common/Input";
import { getCategories } from "../../services/categoryService";

export default function FilterBar({ value, onChange }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get("category") || "";

  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const data = await getCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading categories:", err);
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const handleCategoryChange = (categoryName) => {
    if (categoryName) {
      navigate(`/products?category=${encodeURIComponent(categoryName)}`);
    } else {
      navigate("/products");
    }
  };

  const handleClearCategory = () => {
    navigate("/products");
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-end",
        padding: "12px 0",
        flexWrap: "wrap",
      }}
    >
      {/* Search Input */}
      <div style={{ minWidth: 250, flex: "0 0 auto" }}>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            marginBottom: 6,
            fontWeight: 500,
            color: "#666",
          }}
        >
          Tìm kiếm sản phẩm
        </label>
        <Input
          placeholder="Nhập tên sản phẩm..."
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>

      {/* Category Filter */}
      <div style={{ minWidth: 200, flex: "0 0 auto" }}>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            marginBottom: 6,
            fontWeight: 500,
            color: "#666",
          }}
        >
          Danh mục
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={currentCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "14px",
              fontFamily: "inherit",
              cursor: "pointer",
              backgroundColor: "#fff",
            }}
            disabled={isLoadingCategories}
          >
            <option value="">-- Tất cả danh mục --</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Clear Button */}
          {currentCategory && (
            <button
              onClick={handleClearCategory}
              style={{
                padding: "8px 12px",
                border: "1px solid #ef4444",
                borderRadius: "6px",
                backgroundColor: "#fecaca",
                color: "#991b1b",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              title="Xóa bộ lọc"
            >
              <IoClose size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
