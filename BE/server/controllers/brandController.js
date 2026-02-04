const brandService = require("../services/brandService");

exports.getBrands = async (req, res) => {
  try {
    const brands = await brandService.getBrands();
    return res.json(brands);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.getBrandByIdOrSlug = async (req, res) => {
  try {
    const brand = await brandService.getBrandByIdOrSlug(req.params.idOrSlug);
    return res.json(brand);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.createBrand = async (req, res) => {
  try {
    const created = await brandService.createBrand(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const saved = await brandService.updateBrand(req.params.id, req.body);
    return res.json(saved);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const result = await brandService.deleteBrand(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};
