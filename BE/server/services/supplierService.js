const Supplier = require("../models/Supplier");
const { createHttpError } = require("../utils/httpError");

async function getSuppliers() {
  return Supplier.find({}).sort({ createdAt: -1 });
}

async function getSupplierById(id) {
  const supplier = await Supplier.findById(id);
  if (!supplier) throw createHttpError(404, "Không tìm thấy nhà cung cấp");
  return supplier;
}

async function createSupplier(payload) {
  return Supplier.create(payload);
}

async function updateSupplier(id, payload) {
  const updated = await Supplier.findByIdAndUpdate(id, payload, { new: true });
  if (!updated) throw createHttpError(404, "Không tìm thấy nhà cung cấp");
  return updated;
}

async function deleteSupplier(id) {
  const deleted = await Supplier.findByIdAndDelete(id);
  if (!deleted) throw createHttpError(404, "Không tìm thấy nhà cung cấp");
  return { message: "Đã xóa nhà cung cấp" };
}

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
