const categoryService = require("../services/categoryService");

exports.getCategories = async (req, res) => {
  try {
    const categories = await categoryService.getCategories({
      parentId: req.query.parentId,
    });
    return res.json(categories);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.getCategoryByIdOrSlug = async (req, res) => {
  try {
    const category = await categoryService.getCategoryByIdOrSlug(
      req.params.idOrSlug,
    );
    return res.json(category);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const created = await categoryService.createCategory(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const saved = await categoryService.updateCategory(req.params.id, req.body);
    return res.json(saved);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};
