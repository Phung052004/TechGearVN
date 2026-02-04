const ImportReceipt = require("../models/ImportReceipt");
const Product = require("../models/Product");
const { createHttpError } = require("../utils/httpError");

async function getReceipts() {
  return ImportReceipt.find({})
    .populate("supplier", "name")
    .populate("staff", "fullName email")
    .populate("details.product", "name sku")
    .sort({ createdAt: -1 });
}

async function getReceiptById(id) {
  const receipt = await ImportReceipt.findById(id)
    .populate("supplier", "name")
    .populate("staff", "fullName email")
    .populate("details.product", "name sku");

  if (!receipt) throw createHttpError(404, "Không tìm thấy phiếu nhập");
  return receipt;
}

async function createReceipt(staffUserId, payload = {}) {
  const { supplier, details, note } = payload;
  if (!supplier) throw createHttpError(400, "Thiếu supplier");

  const normalizedDetails = Array.isArray(details) ? details : [];
  if (normalizedDetails.length === 0)
    throw createHttpError(400, "Thiếu details");

  let totalCost = 0;
  const receiptDetails = [];

  for (const d of normalizedDetails) {
    const productId = d?.product;
    const quantity = Number(d?.quantity || 0);
    const importPrice = Number(d?.importPrice || 0);

    if (!productId || quantity <= 0 || importPrice < 0) continue;

    const product = await Product.findById(productId);
    if (!product) {
      throw createHttpError(404, `Không tìm thấy sản phẩm: ${productId}`);
    }

    receiptDetails.push({ product: product._id, quantity, importPrice });
    totalCost += quantity * importPrice;
  }

  if (receiptDetails.length === 0)
    throw createHttpError(400, "Details không hợp lệ");

  const receipt = await ImportReceipt.create({
    supplier,
    staff: staffUserId,
    totalCost,
    note,
    details: receiptDetails,
  });

  for (const d of receiptDetails) {
    await Product.findByIdAndUpdate(d.product, {
      $inc: { stockQuantity: d.quantity },
    });
  }

  return receipt;
}

module.exports = {
  getReceipts,
  getReceiptById,
  createReceipt,
};
