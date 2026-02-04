import React, { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { useCart } from "../../context";
import { FALLBACK_PRODUCT_IMAGE } from "../../constants/images";

function formatVnd(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price ?? 0);
}

export default function Cart() {
  const navigate = useNavigate();
  const { cart, loading, refreshCart, updateItem, removeItem, clear } =
    useCart();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    refreshCart().catch(() => {
      // Errors are handled by actions; keep silent on initial load.
    });
  }, [token, refreshCart]);

  const items = Array.isArray(cart?.items) ? cart.items : [];
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item?.price ?? item?.product?.price ?? 0);
      const qty = Number(item?.quantity ?? 0);
      return sum + price * qty;
    }, 0);
  }, [items]);

  async function handleChangeQty(item, nextQty) {
    const productId = item?.product?._id ?? item?.product;
    if (!productId) return;

    try {
      await updateItem({
        productId,
        quantity: Math.max(1, Number(nextQty || 1)),
      });
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không cập nhật được giỏ hàng",
      );
    }
  }

  async function handleRemove(item) {
    const productId = item?.product?._id ?? item?.product;
    if (!productId) return;

    try {
      await removeItem(productId);
      toast.success("Đã xóa sản phẩm khỏi giỏ");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không xóa được sản phẩm",
      );
    }
  }

  async function handleClear() {
    try {
      await clear();
      toast.success("Đã xóa toàn bộ giỏ hàng");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không xóa được giỏ hàng",
      );
    }
  }

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="text-xl font-extrabold text-gray-900">Giỏ hàng</div>
          <div className="mt-2 text-gray-700">
            Vui lòng{" "}
            <Link
              className="text-blue-600 font-bold hover:underline"
              to="/login"
            >
              đăng nhập
            </Link>{" "}
            để xem giỏ hàng.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-extrabold text-gray-900">Giỏ hàng</h1>
          <Link
            to="/products"
            className="text-sm font-bold text-blue-600 hover:underline"
          >
            Tiếp tục mua hàng
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="font-extrabold text-gray-900">Sản phẩm</div>
              <button
                type="button"
                className="text-sm font-bold text-red-600 hover:underline disabled:opacity-50"
                onClick={handleClear}
                disabled={items.length === 0 || loading}
              >
                Xóa hết
              </button>
            </div>

            {loading && items.length === 0 ? (
              <div className="p-5 text-gray-600">Đang tải giỏ hàng...</div>
            ) : items.length === 0 ? (
              <div className="p-5 text-gray-600">Giỏ hàng đang trống.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item, idx) => {
                  const pid = item?.product?._id ?? item?.product;
                  const name =
                    item?.productName ?? item?.product?.name ?? "Sản phẩm";
                  const price = Number(
                    item?.price ?? item?.product?.price ?? 0,
                  );
                  const qty = Number(item?.quantity ?? 1);
                  const thumb =
                    item?.thumbnail ??
                    item?.product?.thumbnail ??
                    item?.product?.image ??
                    null;
                  const imgSrc = thumb || FALLBACK_PRODUCT_IMAGE;

                  return (
                    <div key={pid ?? idx} className="p-4 md:p-5 flex gap-4">
                      <Link
                        to={pid ? `/product/${pid}` : "#"}
                        className="w-20 h-20 rounded-lg border border-gray-100 bg-white flex items-center justify-center overflow-hidden"
                      >
                        <img
                          src={imgSrc}
                          alt={name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                          }}
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              to={pid ? `/product/${pid}` : "#"}
                              className="font-extrabold text-gray-900 hover:text-blue-600 line-clamp-2"
                            >
                              {name}
                            </Link>
                            <div className="mt-1 text-sm text-gray-600">
                              Đơn giá:{" "}
                              <span className="font-bold text-gray-900">
                                {formatVnd(price)}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="text-sm font-bold text-red-600 hover:underline"
                            onClick={() => handleRemove(item)}
                          >
                            Xóa
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                          <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              className="w-10 h-10 flex items-center justify-center hover:bg-gray-50"
                              onClick={() => handleChangeQty(item, qty - 1)}
                              disabled={qty <= 1}
                            >
                              -
                            </button>
                            <div className="w-12 h-10 flex items-center justify-center font-extrabold text-gray-900">
                              {qty}
                            </div>
                            <button
                              type="button"
                              className="w-10 h-10 flex items-center justify-center hover:bg-gray-50"
                              onClick={() => handleChangeQty(item, qty + 1)}
                            >
                              +
                            </button>
                          </div>

                          <div className="text-sm font-extrabold text-gray-900">
                            Tạm tính:{" "}
                            <span className="text-red-600">
                              {formatVnd(price * qty)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-fit">
            <div className="font-extrabold text-gray-900 text-lg">
              Tổng cộng
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-600">Tạm tính</span>
              <span className="font-extrabold text-gray-900">
                {formatVnd(subtotal)}
              </span>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 rounded-lg disabled:opacity-50"
                onClick={() => navigate("/checkout")}
                disabled={items.length === 0}
              >
                Thanh toán
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Phí vận chuyển sẽ được hiển thị ở bước thanh toán.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
