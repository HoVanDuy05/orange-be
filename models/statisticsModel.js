const db = require('../config/db');

class StatisticsModel {
  /**
   * Get overall stats including cost and profit
   * type: 'daily', 'monthly', 'yearly'
   */
  static async getFinancialStats(type = 'daily', year = null, month = null) {
    let revenueSql = '';
    let costSql = '';
    let groupFormat = '';
    let dateRangeSql = '';

    if (type === 'daily') {
      groupFormat = 'DATE(paid_at)';
      revenueSql = `SELECT DATE(paid_at) as time_label, SUM(amount) as revenue FROM payments WHERE payment_status = 'success' GROUP BY 1`;
      costSql = `SELECT DATE(stock_date) as time_label, SUM(quantity * unit_price) as cost FROM stock_in GROUP BY 1`;
    } else if (type === 'monthly') {
      revenueSql = `SELECT TO_CHAR(paid_at, 'YYYY-MM') as time_label, SUM(amount) as revenue FROM payments WHERE payment_status = 'success' GROUP BY 1`;
      costSql = `SELECT TO_CHAR(stock_date, 'YYYY-MM') as time_label, SUM(quantity * unit_price) as cost FROM stock_in GROUP BY 1`;
    } else if (type === 'yearly') {
      revenueSql = `SELECT TO_CHAR(paid_at, 'YYYY') as time_label, SUM(amount) as revenue FROM payments WHERE payment_status = 'success' GROUP BY 1`;
      costSql = `SELECT TO_CHAR(stock_date, 'YYYY') as time_label, SUM(quantity * unit_price) as cost FROM stock_in GROUP BY 1`;
    } else if (type === 'hourly') {
       revenueSql = `SELECT TO_CHAR(paid_at, 'HH24:00') as time_label, SUM(amount) as revenue FROM payments WHERE payment_status = 'success' AND DATE(paid_at) = CURRENT_DATE GROUP BY 1`;
       costSql = `SELECT TO_CHAR(stock_date, 'HH24:00') as time_label, SUM(quantity * unit_price) as cost FROM stock_in WHERE DATE(stock_date) = CURRENT_DATE GROUP BY 1`;
    }

    const { rows: revenueData } = await db.query(revenueSql);
    const { rows: costData } = await db.query(costSql);

    // Merge data by time_label
    const merged = {};
    revenueData.forEach(r => {
      merged[r.time_label] = { time_label: r.time_label, revenue: Number(r.revenue), cost: 0, profit: Number(r.revenue) };
    });
    costData.forEach(c => {
      if (merged[c.time_label]) {
        merged[c.time_label].cost = Number(c.cost);
        merged[c.time_label].profit = merged[c.time_label].revenue - Number(c.cost);
      } else {
        merged[c.time_label] = { time_label: c.time_label, revenue: 0, cost: Number(c.cost), profit: -Number(c.cost) };
      }
    });

    return Object.values(merged).sort((a, b) => a.time_label > b.time_label ? 1 : -1);
  }

  static async getRevenueByCategory() {
    const sql = `
      SELECT 
        c.category_name, 
        SUM(oi.quantity * oi.unit_price) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_status = 'paid'
      GROUP BY c.category_name
      ORDER BY revenue DESC;
    `;
    const { rows } = await db.query(sql);
    return rows;
  }

  static async getMostSoldProducts() {
    const sql = `
      SELECT 
        p.product_name, 
        SUM(oi.quantity) as total_sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_status = 'paid'
      GROUP BY p.product_name
      ORDER BY total_sold DESC
      LIMIT 10;
    `;
    const { rows } = await db.query(sql);
    return rows;
  }
}

module.exports = StatisticsModel;
