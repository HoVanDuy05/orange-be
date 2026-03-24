const db = require('../config/db');

class StatisticsModel {
  static async getDailyRevenue() {
    const sql = `
      SELECT 
        DATE(paid_at) as date, 
        SUM(amount) as revenue 
      FROM payments 
      WHERE payment_status = 'success'
      GROUP BY DATE(paid_at)
      ORDER BY date DESC
      LIMIT 30;
    `;
    const { rows } = await db.query(sql);
    return rows;
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
