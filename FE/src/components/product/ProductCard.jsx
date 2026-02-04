import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { FALLBACK_PRODUCT_IMAGE } from "../../constants/images";

export default function ProductCard({ product }) {
  const productId = product?._id ?? product?.id;
  const formatPrice = useMemo(
    () => (price) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price ?? 0),
    [],
  );

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
      <Link
        to={productId ? `/product/${productId}` : "#"}
        className="block p-4"
      >
        <div className="w-full h-40 flex items-center justify-center">
          <img
            src={product?.thumbnail ?? product?.image}
            alt={product?.name ?? "Product"}
            className="w-full h-40 object-contain"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
            }}
          />
        </div>
      </Link>

      <div className="px-4 pb-4 flex flex-col flex-1">
        <Link
          to={productId ? `/product/${productId}` : "#"}
          className="block text-sm font-bold text-gray-900 line-clamp-2 hover:text-blue-600 min-h-[40px]"
        >
          {product?.name ?? "Product"}
        </Link>

        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <div className="text-red-600 font-extrabold">
              {formatPrice(product?.price)}
            </div>
            <div className="text-gray-400 text-xs line-through min-h-[16px]">
              {Number(product?.oldPrice) > Number(product?.price)
                ? formatPrice(product?.oldPrice)
                : "\u00A0"}
            </div>
          </div>

          {(Number(product?.discount) || 0) > 0 && (
            <span className="bg-red-600 text-white text-xs font-extrabold px-2 py-1 rounded-md">
              -{product.discount}%
            </span>
          )}
        </div>

        <div className="mt-auto pt-3">
          <span
            className={`inline-flex text-[11px] font-bold px-3 py-1 rounded-full ${
              Number(product?.countInStock) <= 0
                ? "bg-red-600 text-white"
                : "bg-green-100 text-green-700"
            }`}
          >
            {Number(product?.countInStock) <= 0 ? "Hết hàng" : "Còn hàng"}
          </span>
        </div>
      </div>
    </div>
  );
}
