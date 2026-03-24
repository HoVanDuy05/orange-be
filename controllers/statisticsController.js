const StatisticsModel = require('../models/statisticsModel');

exports.getRevenueStats = async (req, res) => {
  try {
    const dailyRevenue = await StatisticsModel.getDailyRevenue();
    const categoriesRevenue = await StatisticsModel.getRevenueByCategory();
    const topProducts = await StatisticsModel.getMostSoldProducts();

    res.status(200).json({
      success: true,
      data: {
        daily: dailyRevenue,
        byCategory: categoriesRevenue,
        topProducts: topProducts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
