const supplierService = require("../services/supplierService");

exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await supplierService.getSuppliers();
    return res.json(suppliers);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    return res.json(supplier);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const created = await supplierService.createSupplier(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const updated = await supplierService.updateSupplier(
      req.params.id,
      req.body,
    );
    return res.json(updated);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const result = await supplierService.deleteSupplier(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};
