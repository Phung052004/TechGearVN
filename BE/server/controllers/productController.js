const productService = require("../services/productService");

// --- LẤY TẤT CẢ SẢN PHẨM ---
exports.getProducts = async (req, res) => {
  try {
    const products = await productService.getProducts(req.query);
    return res.json(products);
  } catch (error) {
    const status = error?.statusCode || 500;
    if (status === 500) console.error("getProducts error:", error);
    return res.status(status).json({ message: error.message });
  }
};

// --- LẤY CHI TIẾT 1 SẢN PHẨM ---
exports.getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return res.json(product);
  } catch (error) {
    const status = error?.statusCode || 500;
    if (status === 500) console.error("getProductById error:", error);
    return res.status(status).json({ message: error.message });
  }
};

// --- TẠO SẢN PHẨM MỚI (Cho Admin) ---
exports.createProduct = async (req, res) => {
  try {
    const created = await productService.createProduct(req.body);
    return res.status(201).json(created);
  } catch (error) {
    const status = error?.statusCode || 400;
    if (status === 500) console.error("createProduct error:", error);
    return res.status(status).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const updated = await productService.updateProduct(req.params.id, req.body);
    return res.json(updated);
  } catch (error) {
    const status = error?.statusCode || 400;
    if (status === 500) console.error("updateProduct error:", error);
    return res.status(status).json({ message: error.message });
  }
};

exports.getProductSpecs = async (req, res) => {
  try {
    const specs = await productService.getProductSpecs(req.params.id);
    return res.json(specs);
  } catch (error) {
    const status = error?.statusCode || 500;
    if (status === 500) console.error("getProductSpecs error:", error);
    return res.status(status).json({ message: error.message });
  }
};

// Replace specs for a product. Body: { specs: [{ specKey, specValue }, ...] }
exports.replaceProductSpecs = async (req, res) => {
  try {
    const saved = await productService.replaceProductSpecs(
      req.params.id,
      req.body.specs,
    );
    return res.json(saved);
  } catch (error) {
    const status = error?.statusCode || 400;
    if (status === 500) console.error("replaceProductSpecs error:", error);
    return res.status(status).json({ message: error.message });
  }
};
