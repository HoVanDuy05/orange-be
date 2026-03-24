const StatisticsModel = require('../models/statisticsModel');

exports.getRevenueStats = async (req, res) => {
  try {
    const { type = 'daily' } = req.query; // 'daily', 'monthly', 'yearly', 'hourly'
    const financialStats = await StatisticsModel.getFinancialStats(type);
    const categoriesRevenue = await StatisticsModel.getRevenueByCategory();
    const topProducts = await StatisticsModel.getMostSoldProducts();

    res.status(200).json({
      success: true,
      data: {
        financial: financialStats,
        byCategory: categoriesRevenue,
        topProducts: topProducts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
