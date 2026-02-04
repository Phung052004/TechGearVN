import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { orderService } from "../../services";

export default function PaymentResult() {
  const [params] = useSearchParams();
  const provider = params.get("provider") || "";
  const success = params.get("success") === "1";
  const orderId = params.get("orderId") || "";
  const message = params.get("message") || "";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => {
    if (success) return "Thanh toán thành công";
    return "Thanh toán thất bại";
  }, [success]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !orderId) return;

    setLoading(true);
    orderService
      .getOrderById(orderId)
      .then(setOrder)
      .catch(() => {
        // ignore
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="bg-gray-50 min-h-[70vh]">
      <div className="container mx-auto px-4 py-8">
        <div
          className={`rounded-xl border shadow-sm p-6 bg-white ${
            success ? "border-green-100" : "border-red-100"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                className={`text-2xl font-extrabold ${
                  success ? "text-green-700" : "text-red-700"
                }`}
              >
                {title}
              </h1>
              <div className="text-sm text-gray-600 mt-2">
                {provider ? `Cổng thanh toán: ${provider}` : null}
              </div>
              {orderId ? (
                <div className="text-sm text-gray-600 mt-1">
                  Mã đơn:{" "}
                  <span className="font-bold text-gray-900">{orderId}</span>
                </div>
              ) : null}
              {message ? (
                <div className="text-sm text-gray-700 mt-3">{message}</div>
              ) : null}

              {loading ? (
                <div className="text-sm text-gray-600 mt-3">
                  Đang tải thông tin đơn hàng...
                </div>
              ) : order ? (
                <div className="mt-4 rounded-lg bg-gray-50 border border-gray-100 p-4 text-sm">
                  <div className="flex flex-wrap gap-3">
                    <div>
                      <div className="text-gray-500">Trạng thái đơn</div>
                      <div className="font-extrabold text-gray-900">
                        {order.orderStatus}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Trạng thái thanh toán</div>
                      <div className="font-extrabold text-gray-900">
                        {order.paymentStatus}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Phương thức</div>
                      <div className="font-extrabold text-gray-900">
                        {order.paymentMethod}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="shrink-0">
              <Link
                to="/profile?view=order"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold"
              >
                Xem đơn hàng
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-bold text-gray-800"
            >
              Về trang chủ
            </Link>
            <Link
              to="/products"
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-bold text-gray-800"
            >
              Tiếp tục mua sắm
            </Link>
          </div>

          {!success ? (
            <div className="mt-5 text-xs text-gray-500">
              Nếu bạn đã bị trừ tiền nhưng trạng thái chưa cập nhật, hãy thử tải
              lại trang sau 1-2 phút.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
