const articleService = require("../services/articleService");

exports.getArticles = async (req, res) => {
  try {
    const articles = await articleService.getArticles({
      type: req.query.type,
      all: req.query.all,
    });

    return res.json(articles);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.getArticleByIdOrSlug = async (req, res) => {
  try {
    const article = await articleService.getArticleByIdOrSlug({
      idOrSlug: req.params.idOrSlug,
      userRole: req.user?.role,
    });

    return res.json(article);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.createArticle = async (req, res) => {
  try {
    const created = await articleService.createArticle({
      payload: req.body,
      authorId: req.user._id,
    });
    return res.status(201).json(created);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const updated = await articleService.updateArticle(req.params.id, req.body);
    return res.json(updated);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const result = await articleService.deleteArticle(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};
