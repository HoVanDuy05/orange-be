const db = require('../config/db');

class StatisticsModel {
  /**
   * Financial stats: revenue, order count grouped by time.
   * Revenue = only 'completed' orders (đã hoàn thành, đã đóng bill).
   * type: 'hourly' | 'daily' | 'monthly' | 'yearly'
   */
  static async getFinancialStats(type = 'daily', date = null) {
    // Date filter - default to today for hourly, all-time for others
    let dateWhere = '';
    const params = [];
    let idx = 1;

    if (type === 'hourly') {
      dateWhere = `AND DATE(paid_at) = $${idx++}`;
      params.push(date || 'CURRENT_DATE');
    } else if (date) {
      dateWhere = `AND DATE(paid_at) = $${idx++}`;
      params.push(date);
    }

    const groupFormats = {
      hourly:  `TO_CHAR(paid_at, 'HH24:00')`,
      daily:   `DATE(paid_at)`,
      monthly: `TO_CHAR(paid_at, 'YYYY-MM')`,
      yearly:  `TO_CHAR(paid_at, 'YYYY')`,
    };
    const groupExpr = groupFormats[type] || groupFormats.daily;

    const revenueSql = `
      SELECT
        ${groupExpr}::text AS time_label,
        SUM(total_amount)  AS revenue,
        COUNT(id)          AS order_count,
        SUM(CASE WHEN payment_method = 'cash'     THEN total_amount ELSE 0 END) AS cash_revenue,
        SUM(CASE WHEN payment_method = 'transfer' THEN total_amount ELSE 0 END) AS transfer_revenue,
        SUM(CASE WHEN order_type = 'dine_in'   THEN total_amount ELSE 0 END) AS dine_in_revenue,
        SUM(CASE WHEN order_type = 'take_away' THEN total_amount ELSE 0 END) AS take_away_revenue,
        SUM(CASE WHEN order_type = 'delivery'  THEN total_amount ELSE 0 END) AS delivery_revenue
      FROM orders
      WHERE order_status = 'completed' AND paid_at IS NOT NULL ${dateWhere}
      GROUP BY 1
      ORDER BY 1
    `;

    const { rows } = await db.query(revenueSql, params);

    return rows.map(r => ({
      time_label:        String(r.time_label),
      revenue:           Number(r.revenue || 0),
      order_count:       Number(r.order_count || 0),
      cash_revenue:      Number(r.cash_revenue || 0),
      transfer_revenue:  Number(r.transfer_revenue || 0),
      dine_in_revenue:   Number(r.dine_in_revenue || 0),
      take_away_revenue: Number(r.take_away_revenue || 0),
      delivery_revenue:  Number(r.delivery_revenue || 0),
    }));
  }

  /** Today's summary */
  static async getTodaySummary() {
    const { rows } = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE order_status = 'completed')                    AS completed_orders,
        COUNT(*) FILTER (WHERE order_status = 'cancelled')                    AS cancelled_orders,
        COUNT(*) FILTER (WHERE order_status NOT IN ('completed', 'cancelled')) AS active_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE order_status = 'completed'), 0) AS today_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE order_status = 'completed' AND payment_method = 'cash'), 0)     AS cash_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE order_status = 'completed' AND payment_method = 'transfer'), 0) AS transfer_revenue
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
    `);
    const r = rows[0];
    return {
      completed_orders: Number(r.completed_orders),
      cancelled_orders: Number(r.cancelled_orders),
      active_orders:    Number(r.active_orders),
      today_revenue:    Number(r.today_revenue),
      cash_revenue:     Number(r.cash_revenue),
      transfer_revenue: Number(r.transfer_revenue),
    };
  }

  /** Revenue breakdown by product category */
  static async getRevenueByCategory() {
    const { rows } = await db.query(`
      SELECT
        c.category_name,
        SUM(oi.quantity * oi.unit_price) AS revenue,
        SUM(oi.quantity)                 AS items_sold
      FROM order_items oi
      JOIN products   p ON p.id = oi.product_id
      JOIN categories c ON c.id = p.category_id
      JOIN orders     o ON o.id = oi.order_id
      WHERE o.order_status = 'completed'
      GROUP BY c.category_name
      ORDER BY revenue DESC
    `);
    return rows;
  }

  /** Top 10 best-selling products */
  static async getTopProducts(limit = 10) {
    const { rows } = await db.query(`
      SELECT
        p.id,
        p.product_name,
        p.image_url,
        SUM(oi.quantity)                 AS total_sold,
        SUM(oi.quantity * oi.unit_price) AS total_revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders   o ON o.id = oi.order_id
      WHERE o.order_status = 'completed'
      GROUP BY p.id, p.product_name, p.image_url
      ORDER BY total_sold DESC
      LIMIT $1
    `, [limit]);
    return rows;
  }

  /** Orders by hour-of-day (traffic heatmap) */
  static async getHourlyTraffic() {
    const { rows } = await db.query(`
      SELECT
        EXTRACT(HOUR FROM created_at)::int AS hour,
        COUNT(*) AS order_count
      FROM orders
      WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY 1
      ORDER BY 1
    `);
    return rows;
  }
}

module.exports = StatisticsModel;
