const voucherService = require("../services/voucherService");

exports.getVouchers = async (req, res) => {
  try {
    const vouchers = await voucherService.getVouchers({
      active: req.query.active,
    });
    return res.json(vouchers);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.getVoucherByCode = async (req, res) => {
  try {
    const voucher = await voucherService.getVoucherByCode(req.params.code);
    return res.json(voucher);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.createVoucher = async (req, res) => {
  try {
    const created = await voucherService.createVoucher(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.updateVoucher = async (req, res) => {
  try {
    const updated = await voucherService.updateVoucher(req.params.id, req.body);
    return res.json(updated);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.deleteVoucher = async (req, res) => {
  try {
    const result = await voucherService.deleteVoucher(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

// GET /api/vouchers/validate?code=...&orderValue=...
exports.validateVoucher = async (req, res) => {
  try {
    const { httpStatus, payload } = await voucherService.validateVoucher({
      code: req.query.code,
      orderValue: req.query.orderValue,
    });
    return res.status(httpStatus).json(payload);
  } catch (error) {
    return res
      .status(error.statusCode || 400)
      .json({ valid: false, message: error.message });
  }
};
