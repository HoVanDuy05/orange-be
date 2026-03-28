const StatisticsModel = require('../models/statisticsModel');

/** GET /api/stats/revenue?type=daily|monthly|yearly|hourly&date=YYYY-MM-DD */
exports.getRevenueStats = async (req, res) => {
  try {
    const { type = 'daily', date } = req.query;
    const [financial, categories, topProducts, hourlyTraffic, todaySummary] = await Promise.all([
      StatisticsModel.getFinancialStats(type, date),
      StatisticsModel.getRevenueByCategory(),
      StatisticsModel.getTopProducts(10),
      StatisticsModel.getHourlyTraffic(),
      StatisticsModel.getTodaySummary(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        financial,
        byCategory: categories,
        topProducts,
        hourlyTraffic,
        today: todaySummary,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/stats/today */
exports.getTodayStats = async (req, res) => {
  try {
    const data = await StatisticsModel.getTodaySummary();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
