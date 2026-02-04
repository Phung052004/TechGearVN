import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FilterBar from "../../components/product/FilterBar";
import ProductList from "../../components/product/ProductList";
import { productService } from "../../services";

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const category = (searchParams.get("category") ?? "").trim();

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiParams = useMemo(() => {
    const p = {};
    if (category) p.category = category;
    return p;
  }, [category]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await productService.getProducts(apiParams);
        if (!isMounted) return;
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không tải được sản phẩm",
        );
        setProducts([]);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [apiParams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => (p?.name ?? "").toLowerCase().includes(q));
  }, [products, query]);

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="container mx-auto px-4 py-4 text-sm text-gray-600 mb-2">
        <Link to="/" className="hover:text-red-600">
          Trang chủ
        </Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-900 font-medium">Sản phẩm</span>
        {category ? (
          <>
            <span className="mx-2">&gt;</span>
            <span className="text-gray-900 font-medium">{category}</span>
          </>
        ) : null}
      </div>

      <div className="container mx-auto px-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">
                Sản phẩm
              </h1>
              <div className="text-sm text-gray-600 mt-1">
                {category ? `Danh mục: ${category}` : "Tất cả sản phẩm"}
              </div>
            </div>

            <div className="w-full md:w-auto">
              <FilterBar value={query} onChange={setQuery} />
            </div>
          </div>

          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="mt-4">Đang tải sản phẩm...</div>
          ) : (
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-3">
                Hiển thị {filtered.length} sản phẩm
              </div>
              {filtered.length > 0 ? (
                <ProductList products={filtered} />
              ) : (
                <div className="border border-dashed border-gray-200 rounded-xl p-8 bg-gray-50 text-center">
                  <div className="text-lg font-extrabold text-gray-900">
                    Chưa có sản phẩm để hiển thị
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    API đang trả về danh sách rỗng hoặc bạn đang lọc theo danh mục không có dữ liệu.
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-900 font-semibold"
                      onClick={() => setQuery("")}
                    >
                      Xóa tìm kiếm
                    </button>
                    <Link
                      to={category ? "/products" : "/"}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                      {category ? "Xem tất cả sản phẩm" : "Về trang chủ"}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
