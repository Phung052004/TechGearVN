import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth, useCart } from "../../context";
import {
  orderService,
  paymentService,
  settingsService,
  voucherService,
} from "../../services";
import { FALLBACK_PRODUCT_IMAGE } from "../../constants/images";

function formatVnd(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price ?? 0);
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, loading, refreshCart, clear } = useCart();
  const { user } = useAuth();

  const token = localStorage.getItem("token");

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplying, setVoucherApplying] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedForValue, setAppliedForValue] = useState(null);

  const [settings, setSettings] = useState(null);

  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (prefilled) return;
    if (!user) return;

    const defaultAddr = Array.isArray(user.addresses)
      ? user.addresses.find((a) => a?.isDefault)
      : null;

    const nextFullName =
      defaultAddr?.fullName?.trim?.() || user.fullName?.trim?.() || "";
    const nextPhone =
      defaultAddr?.phoneNumber?.trim?.() || user.phone?.trim?.() || "";
    const nextAddress =
      defaultAddr?.addressLine?.trim?.() ||
      [user.address, user.provinceCity].filter(Boolean).join(", ").trim() ||
      "";

    setFullName((prev) => (prev ? prev : nextFullName));
    setPhoneNumber((prev) => (prev ? prev : nextPhone));
    setShippingAddress((prev) => (prev ? prev : nextAddress));
    setPrefilled(true);
  }, [user, prefilled]);

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

  useEffect(() => {
    if (!token) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }

    refreshCart().catch(() => {
      // ignore initial load errors
    });
  }, [token, navigate, location.pathname, refreshCart]);

  const items = Array.isArray(cart?.items) ? cart.items : [];
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item?.price ?? item?.product?.price ?? 0);
      const qty = Number(item?.quantity ?? 0);
      return sum + price * qty;
    }, 0);
  }, [items]);

  const shippingFee = Number(settings?.shippingFee || 0);
  const total = subtotal + shippingFee;
  const effectiveDiscount =
    appliedVoucher && appliedForValue === subtotal
      ? Math.min(Number(discountAmount || 0), total)
      : 0;
  const grandTotal = Math.max(0, total - effectiveDiscount);

  useEffect(() => {
    // If cart total changes, require re-apply voucher
    if (!appliedVoucher) return;
    if (appliedForValue === null) return;
    if (appliedForValue !== subtotal) {
      setDiscountAmount(0);
    }
  }, [subtotal, appliedVoucher, appliedForValue]);

  async function applyVoucher() {
    const code = String(voucherCode || "")
      .trim()
      .toUpperCase();
    if (!code) {
      toast.error("Nhập mã voucher");
      return;
    }
    if (subtotal <= 0) {
      toast.error("Giỏ hàng chưa có giá trị");
      return;
    }

    try {
      setVoucherApplying(true);
      const res = await voucherService.validateVoucher({
        code,
        orderValue: subtotal,
      });

      if (!res?.valid) {
        setAppliedVoucher(null);
        setDiscountAmount(0);
        setAppliedForValue(null);
        toast.error(res?.message || "Voucher không hợp lệ");
        return;
      }

      setAppliedVoucher(res?.voucher ?? { code });
      setDiscountAmount(Number(res?.discountAmount || 0));
      setAppliedForValue(subtotal);
      toast.success("Đã áp dụng voucher");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Không kiểm tra được voucher",
      );
    } finally {
      setVoucherApplying(false);
    }
  }

  function removeVoucher() {
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setAppliedForValue(null);
    setVoucherCode("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (items.length === 0) {
      toast.info("Giỏ hàng đang trống");
      return;
    }

    const payload = {
      items: items
        .map((it) => ({
          product: it?.product?._id ?? it?.product,
          quantity: Number(it?.quantity ?? 0),
        }))
        .filter((x) => x.product && x.quantity > 0),
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      shippingAddress: shippingAddress.trim(),
      paymentMethod,
      note: note.trim(),
      shippingFee,
    };

    if (appliedVoucher && appliedForValue === subtotal) {
      payload.voucherCode = String(appliedVoucher.code || voucherCode)
        .trim()
        .toUpperCase();
    }

    if (!payload.fullName || !payload.phoneNumber || !payload.shippingAddress) {
      toast.error("Vui lòng nhập đầy đủ họ tên, SĐT và địa chỉ");
      return;
    }

    try {
      setSubmitting(true);
      const order = await orderService.createOrder(payload);

      if (paymentMethod === "VNPAY") {
        const { payUrl } = await paymentService.createVnpayPayment(order._id);
        await clear();
        if (payUrl) {
          window.location.href = payUrl;
          return;
        }
        navigate(
          `/payment-result?provider=VNPAY&success=0&orderId=${order._id}`,
        );
        return;
      }

      if (paymentMethod === "MOMO") {
        const { payUrl } = await paymentService.createMomoPayment(order._id);
        await clear();
        if (payUrl) {
          window.location.href = payUrl;
          return;
        }
        navigate(
          `/payment-result?provider=MOMO&success=0&orderId=${order._id}`,
        );
        return;
      }

      if (paymentMethod === "PAYOS") {
        const { payUrl } = await paymentService.createPayosPayment(order._id);
        await clear();
        if (payUrl) {
          window.location.href = payUrl;
          return;
        }
        navigate(
          `/payment-result?provider=PAYOS&success=0&orderId=${order._id}`,
        );
        return;
      }

      await clear();
      toast.success("Đặt hàng thành công");
      navigate(`/profile?view=account`, { replace: true, state: { order } });
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Không đặt hàng được",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) return null;

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-extrabold text-gray-900">Thanh toán</h1>
          <Link
            to="/cart"
            className="text-sm font-bold text-blue-600 hover:underline"
          >
            Quay lại giỏ hàng
          </Link>
        </div>

        {loading && items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-gray-600">
            Đang tải giỏ hàng...
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="text-gray-700">Giỏ hàng đang trống.</div>
            <Link
              to="/products"
              className="inline-block mt-3 text-blue-600 font-bold hover:underline"
            >
              Tới trang sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
            >
              <div className="font-extrabold text-gray-900 text-lg">
                Thông tin giao hàng
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="09xxxxxxxx"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Địa chỉ nhận hàng
                </label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 min-h-[90px] focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                />
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Phương thức thanh toán
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="COD">COD (Thanh toán khi nhận hàng)</option>
                    <option value="VNPAY">VNPAY</option>
                    <option value="MOMO">MoMo</option>
                    <option value="PAYOS">PayOS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="(tuỳ chọn)"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 rounded-lg disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "Đang đặt hàng..." : "Xác nhận đặt hàng"}
              </button>
            </form>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-fit">
              <div className="font-extrabold text-gray-900 text-lg">
                Đơn hàng
              </div>

              <div className="mt-4 space-y-3">
                {items.map((item, idx) => {
                  const pid = item?.product?._id ?? item?.product;
                  const name =
                    item?.productName ?? item?.product?.name ?? "Sản phẩm";
                  const price = Number(
                    item?.price ?? item?.product?.price ?? 0,
                  );
                  const qty = Number(item?.quantity ?? 0);
                  const thumb =
                    item?.thumbnail ??
                    item?.product?.thumbnail ??
                    item?.product?.image ??
                    null;
                  const imgSrc = thumb || FALLBACK_PRODUCT_IMAGE;
                  return (
                    <div key={pid ?? idx} className="flex gap-3">
                      <div className="w-14 h-14 rounded-lg border border-gray-100 bg-white overflow-hidden flex items-center justify-center">
                        <img
                          src={imgSrc}
                          alt={name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            // Prevent flicker loop if src keeps failing across re-renders
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-extrabold text-gray-900 line-clamp-2">
                          {name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {qty} × {formatVnd(price)}
                        </div>
                      </div>
                      <div className="text-sm font-extrabold text-gray-900 whitespace-nowrap">
                        {formatVnd(price * qty)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="pb-2">
                  <div className="text-sm font-extrabold text-gray-900">
                    Voucher
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Nhập mã (VD: TECHGEAR-XXXX)"
                      disabled={voucherApplying || submitting}
                    />
                    {appliedVoucher ? (
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg border border-gray-200 font-extrabold text-sm"
                        onClick={removeVoucher}
                        disabled={voucherApplying || submitting}
                      >
                        Bỏ
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg bg-gray-900 text-white font-extrabold text-sm"
                        onClick={applyVoucher}
                        disabled={voucherApplying || submitting}
                      >
                        {voucherApplying ? "..." : "Áp dụng"}
                      </button>
                    )}
                  </div>
                  {appliedVoucher ? (
                    <div className="text-xs text-emerald-700 font-bold mt-2">
                      Đã áp dụng: {appliedVoucher.code}
                      {appliedForValue !== subtotal ? (
                        <span className="text-amber-700">
                          {" "}
                          • Giỏ hàng thay đổi, vui lòng áp dụng lại
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tạm tính</span>
                  <span className="font-extrabold text-gray-900">
                    {formatVnd(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  <span className="font-extrabold text-gray-900">
                    {formatVnd(shippingFee)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Giảm giá</span>
                  <span className="font-extrabold text-emerald-700">
                    -{formatVnd(effectiveDiscount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="font-extrabold text-gray-900">
                    Tổng cộng
                  </span>
                  <span className="font-extrabold text-red-600">
                    {formatVnd(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
