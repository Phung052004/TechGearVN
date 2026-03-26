const adminAnalyticsService = require("../services/adminAnalyticsService");

exports.getAnalyticsOverview = async (req, res) => {
  try {
    const lowStockThreshold = req.query?.lowStockThreshold;
    const data = await adminAnalyticsService.getOverview({
      lowStockThreshold,
    });
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }//123
};
