const crypto = require("crypto");
const http = require("http");
const https = require("https");
const { PayOS } = require("@payos/node");

const Order = require("../models/Order");
const { createHttpError } = require("../utils/httpError");

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
        sorted[key] = obj[key];
      }
    });
  return sorted;
}

function hmacSha512(secret, data) {
  return crypto
    .createHmac("sha512", secret)
    .update(data, "utf-8")
    .digest("hex");
}

function formatDateYYYYMMDDHHmmss(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

function buildQueryString(params) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => usp.append(k, String(v)));
  return usp.toString();
}

function requireEnv(name) {
  const val = process.env[name];
  const trimmed = typeof val === "string" ? val.trim() : val;
  if (!trimmed) {
    throw createHttpError(
      400,
      `Thiếu biến môi trường: ${name}. Lưu ý: sau khi sửa BE/server/.env cần restart backend để dotenv load lại.`,
    );
  }
  return trimmed;
}

function getBackendBaseUrl() {
  const env = process.env.BACKEND_URL;
  if (env && String(env).trim()) return String(env).trim().replace(/\/$/, "");
  const port = process.env.PORT || 5000;
  return `http://localhost:${port}`;
}

function buildFrontendResultUrl({ provider, success, orderId, message } = {}) {
  const base = String(
    process.env.PAYMENT_RESULT_FE_URL || "http://localhost:5174/payment-result",
  ).trim();
  const url = new URL(base);
  if (provider) url.searchParams.set("provider", provider);
  if (orderId) url.searchParams.set("orderId", String(orderId));
  url.searchParams.set("success", success ? "1" : "0");
  if (message) url.searchParams.set("message", message);
  return url.toString();
}

async function mustGetOrderForUser({ user, orderId } = {}) {
  const order = await Order.findById(orderId);
  if (!order) throw createHttpError(404, "Không tìm thấy đơn hàng");
  if (String(order.user) !== String(user._id)) {
    throw createHttpError(403, "Không có quyền truy cập đơn hàng");
  }
  return order;
}

function validateOrderReadyForPayment(order) {
  if (!order) throw createHttpError(400, "Thiếu đơn hàng");
  if (order.paymentStatus === "PAID") {
    throw createHttpError(400, "Đơn hàng đã được thanh toán");
  }
  const amount = Number(order.finalAmount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw createHttpError(400, "Số tiền thanh toán không hợp lệ");
  }
  if (!Array.isArray(order.items) || order.items.length === 0) {
    throw createHttpError(400, "Đơn hàng không có sản phẩm");
  }
}

function postJson(urlString, body, { timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const payload = JSON.stringify(body ?? {});

    const client = url.protocol === "https:" ? https : http;

    const req = client.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: timeoutMs,
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          let data = null;
          try {
            data = raw ? JSON.parse(raw) : null;
          } catch {
            data = null;
          }

          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
            return;
          }

          reject(
            createHttpError(
              400,
              data?.message ||
                data?.errorMessage ||
                "Không tạo được thanh toán MoMo",
            ),
          );
        });
      },
    );

    req.on("timeout", () => {
      req.destroy(createHttpError(408, "MoMo request timeout"));
    });

    req.on("error", (err) => {
      reject(err?.statusCode ? err : createHttpError(400, err.message));
    });

    req.write(payload);
    req.end();
  });
}

let payosClient = null;
function getPayOS() {
  if (payosClient) return payosClient;

  const clientId = requireEnv("PAYOS_CLIENT_ID");
  const apiKey = requireEnv("PAYOS_API_KEY");
  const checksumKey = requireEnv("PAYOS_CHECKSUM_KEY");

  payosClient = new PayOS({ clientId, apiKey, checksumKey });
  return payosClient;
}

function generatePayosOrderCode() {
  // Safe integer: ~ 1.7e15 (Date.now) + 3 digits
  const suffix = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return Number(`${Date.now()}${suffix}`);
}

async function createVnpayPayment({ user, orderId, ipAddr } = {}) {
  const order = await mustGetOrderForUser({ user, orderId });
  if (order.paymentMethod !== "VNPAY") {
    throw createHttpError(400, "Đơn hàng không dùng VNPAY");
  }

  validateOrderReadyForPayment(order);

  const vnpUrl = requireEnv("VNPAY_URL");
  const tmnCode = requireEnv("VNPAY_TMN_CODE");
  const hashSecret = requireEnv("VNPAY_HASH_SECRET");
  const returnUrl = requireEnv("VNPAY_RETURN_URL");

  const txnRef = String(order._id);
  const amount = Math.round(Number(order.finalAmount || 0) * 100);

  const vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: `Thanh toan don hang ${txnRef}`,
    vnp_OrderType: "other",
    vnp_Amount: amount,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: String(ipAddr || "127.0.0.1"),
    vnp_CreateDate: formatDateYYYYMMDDHHmmss(new Date()),
  };

  const sorted = sortObject(vnpParams);
  const signData = buildQueryString(sorted);
  const secureHash = hmacSha512(hashSecret, signData);

  const payUrl = new URL(vnpUrl);
  Object.entries(sorted).forEach(([k, v]) =>
    payUrl.searchParams.set(k, String(v)),
  );
  payUrl.searchParams.set("vnp_SecureHash", secureHash);

  return {
    provider: "VNPAY",
    orderId: order._id,
    payUrl: payUrl.toString(),
  };
}

async function handleVnpayReturn(query = {}) {
  const hashSecret = requireEnv("VNPAY_HASH_SECRET");

  const params = { ...query };
  const secureHash = params.vnp_SecureHash;
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sorted = sortObject(params);
  const signData = buildQueryString(sorted);
  const signed = hmacSha512(hashSecret, signData);

  if (!secureHash || signed !== secureHash) {
    throw createHttpError(400, "Sai chữ ký VNPAY");
  }

  const orderId = params.vnp_TxnRef;
  const rspCode = String(params.vnp_ResponseCode || "");

  const order = await Order.findById(orderId);
  if (!order) {
    return {
      redirectUrl: buildFrontendResultUrl({
        provider: "VNPAY",
        success: false,
        orderId,
        message: "Không tìm thấy đơn hàng",
      }),
    };
  }

  const success = rspCode === "00";
  if (success) {
    order.paymentStatus = "PAID";
    if (order.orderStatus === "PENDING") order.orderStatus = "PROCESSING";
    await order.save();
  }

  return {
    redirectUrl: buildFrontendResultUrl({
      provider: "VNPAY",
      success,
      orderId: order._id,
      message: success
        ? "Thanh toán thành công"
        : `Thanh toán thất bại (code ${rspCode})`,
    }),
  };
}

async function createMomoPayment({ user, orderId } = {}) {
  const order = await mustGetOrderForUser({ user, orderId });
  if (order.paymentMethod !== "MOMO") {
    throw createHttpError(400, "Đơn hàng không dùng MOMO");
  }

  validateOrderReadyForPayment(order);

  // Default to FAKE mode unless explicitly configured for real MoMo
  const shouldFake =
    process.env.MOMO_FAKE !== "0" ||
    !process.env.MOMO_ENDPOINT ||
    !process.env.MOMO_PARTNER_CODE ||
    !process.env.MOMO_ACCESS_KEY ||
    !process.env.MOMO_SECRET_KEY;

  if (shouldFake) {
    const returnUrl = new URL(
      `${getBackendBaseUrl()}/api/v1/payments/momo/return`,
    );
    returnUrl.searchParams.set("orderId", String(order._id));
    returnUrl.searchParams.set("resultCode", "0");
    returnUrl.searchParams.set("message", "Fake MoMo: thanh toán thành công");

    return {
      provider: "MOMO",
      mode: "FAKE",
      orderId: order._id,
      payUrl: returnUrl.toString(),
    };
  }

  const endpoint = requireEnv("MOMO_ENDPOINT");
  const partnerCode = requireEnv("MOMO_PARTNER_CODE");
  const accessKey = requireEnv("MOMO_ACCESS_KEY");
  const secretKey = requireEnv("MOMO_SECRET_KEY");
  const redirectUrl = requireEnv("MOMO_REDIRECT_URL");
  const ipnUrl = process.env.MOMO_IPN_URL || redirectUrl;

  const requestId = `${order._id}-${Date.now()}`;
  const orderInfo = `Thanh toan don hang ${order._id}`;
  const amount = String(Math.round(Number(order.finalAmount || 0)));
  const orderIdStr = String(order._id);
  const requestType = process.env.MOMO_REQUEST_TYPE || "captureWallet";
  const extraData = "";

  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${ipnUrl}` +
    `&orderId=${orderIdStr}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const body = {
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId: orderIdStr,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: "vi",
  };

  const data = await postJson(endpoint, body);

  const payUrl = data?.payUrl || data?.deeplink || data?.shortLink;
  if (!payUrl) {
    throw createHttpError(400, "MoMo không trả về payUrl");
  }

  return {
    provider: "MOMO",
    orderId: order._id,
    payUrl,
    momo: data,
  };
}

async function handleMomoReturn(query = {}) {
  const orderId = query.orderId || query.orderIdStr || query.extraData;
  const resultCode = String(query.resultCode ?? "");

  const order = orderId ? await Order.findById(orderId) : null;
  const success = resultCode === "0";

  if (order && success) {
    order.paymentStatus = "PAID";
    if (order.orderStatus === "PENDING") order.orderStatus = "PROCESSING";
    await order.save();
  }

  return {
    redirectUrl: buildFrontendResultUrl({
      provider: "MOMO",
      success,
      orderId: order?._id || orderId,
      message: success
        ? "Thanh toán thành công"
        : query.message || `Thanh toán thất bại (code ${resultCode})`,
    }),
  };
}

async function createPayosPayment({ user, orderId } = {}) {
  const order = await mustGetOrderForUser({ user, orderId });
  if (order.paymentMethod !== "PAYOS") {
    throw createHttpError(400, "Đơn hàng không dùng PAYOS");
  }

  validateOrderReadyForPayment(order);

  const payos = getPayOS();

  if (!order.payosOrderCode) {
    order.payosOrderCode = generatePayosOrderCode();
    await order.save();
  }

  const amount = Math.round(Number(order.finalAmount || 0));
  const returnUrl = `${getBackendBaseUrl()}/api/v1/payments/payos/return`;
  const cancelUrl = `${getBackendBaseUrl()}/api/v1/payments/payos/cancel`;

  const paymentLink = await payos.paymentRequests.create({
    orderCode: order.payosOrderCode,
    amount,
    description: `DH${String(order._id).slice(-6)}`,
    returnUrl,
    cancelUrl,
  });

  const payUrl = paymentLink?.checkoutUrl || paymentLink?.paymentLinkUrl;
  if (!payUrl) throw createHttpError(400, "PayOS không trả về checkoutUrl");

  if (
    paymentLink?.paymentLinkId &&
    order.payosPaymentLinkId !== paymentLink.paymentLinkId
  ) {
    order.payosPaymentLinkId = paymentLink.paymentLinkId;
    await order.save();
  }

  return {
    provider: "PAYOS",
    mode: "LIVE",
    orderId: order._id,
    orderCode: order.payosOrderCode,
    payUrl,
    payos: paymentLink,
  };
}

async function handlePayosReturn(query = {}) {
  // PayOS return redirect is not trusted for marking PAID.
  // We rely on verified webhook to update DB; return only forwards user to FE result page.
  const orderCode = Number(query.orderCode || query.order_code || 0) || null;
  const order = orderCode
    ? await Order.findOne({ payosOrderCode: orderCode })
    : null;
  const code = String(query.code ?? "");
  const message = String(query.message || query.desc || "").trim();

  const successHint = code === "00";
  return {
    redirectUrl: buildFrontendResultUrl({
      provider: "PAYOS",
      success: successHint,
      orderId: order?._id,
      message:
        message ||
        (successHint ? "Đang xử lý thanh toán" : "Thanh toán bị hủy"),
    }),
  };
}

async function handlePayosCancel(query = {}) {
  const orderCode = Number(query.orderCode || query.order_code || 0) || null;
  const order = orderCode
    ? await Order.findOne({ payosOrderCode: orderCode })
    : null;
  const message = String(query.message || query.desc || "").trim();
  return {
    redirectUrl: buildFrontendResultUrl({
      provider: "PAYOS",
      success: false,
      orderId: order?._id,
      message: message || "Bạn đã hủy thanh toán",
    }),
  };
}

async function handlePayosWebhook(payload = {}) {
  const payos = getPayOS();
  const webhookData = await payos.webhooks.verify(payload);

  const orderCode = webhookData?.data?.orderCode;
  if (!orderCode) throw createHttpError(400, "Webhook thiếu orderCode");

  const order = await Order.findOne({ payosOrderCode: Number(orderCode) });
  if (!order) throw createHttpError(404, "Không tìm thấy đơn hàng (PayOS) ");

  // Success codes: '00' per PayOS examples
  const code = String(webhookData?.code ?? webhookData?.data?.code ?? "");
  const success = code === "00" || webhookData?.success === true;

  if (success && order.paymentStatus !== "PAID") {
    order.paymentStatus = "PAID";
    if (order.orderStatus === "PENDING") order.orderStatus = "PROCESSING";
    if (webhookData?.data?.paymentLinkId) {
      order.payosPaymentLinkId = webhookData.data.paymentLinkId;
    }
    await order.save();
  }

  return { ok: true };
}

async function mockMarkPaid({ user, orderId } = {}) {
  const order = await mustGetOrderForUser({ user, orderId });
  order.paymentStatus = "PAID";
  if (order.orderStatus === "PENDING") order.orderStatus = "PROCESSING";
  await order.save();
  return { message: "OK", order };
}

module.exports = {
  createVnpayPayment,
  handleVnpayReturn,
  createMomoPayment,
  handleMomoReturn,
  createPayosPayment,
  handlePayosReturn,
  handlePayosCancel,
  handlePayosWebhook,
  buildFrontendResultUrl,
  mockMarkPaid,
};
