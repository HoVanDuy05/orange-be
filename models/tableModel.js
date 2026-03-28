const db = require('../config/db');

class TableModel {
  /**
   * Get all tables with dynamic occupancy calculated from active orders.
   * A table is "occupied" if it has active (non-completed, non-cancelled) orders.
   */
  static async getAll() {
    const { rows } = await db.query(`
      SELECT
        dt.*,
        COUNT(o.id) FILTER (
          WHERE o.order_status NOT IN ('completed', 'cancelled')
        ) AS active_order_count,
        CASE
          WHEN COUNT(o.id) FILTER (
            WHERE o.order_status NOT IN ('completed', 'cancelled')
          ) > 0 THEN true
          ELSE false
        END AS is_occupied
      FROM dining_tables dt
      LEFT JOIN orders o ON o.table_id = dt.id
      WHERE dt.is_active = true
      GROUP BY dt.id
      ORDER BY dt.id ASC
    `);
    return rows;
  }

  static async findById(id) {
    const { rows } = await db.query(`
      SELECT
        dt.*,
        COUNT(o.id) FILTER (
          WHERE o.order_status NOT IN ('completed', 'cancelled')
        ) AS active_order_count,
        CASE
          WHEN COUNT(o.id) FILTER (
            WHERE o.order_status NOT IN ('completed', 'cancelled')
          ) > 0 THEN true
          ELSE false
        END AS is_occupied
      FROM dining_tables dt
      LEFT JOIN orders o ON o.table_id = dt.id
      WHERE dt.id = $1
      GROUP BY dt.id
    `, [id]);
    return rows[0];
  }

  static async create(table_name) {
    const { rows } = await db.query(
      'INSERT INTO dining_tables (table_name) VALUES ($1) RETURNING *',
      [table_name]
    );
    return rows[0];
  }

  static async update(id, table_name) {
    const { rows } = await db.query(
      'UPDATE dining_tables SET table_name = $1 WHERE id = $2 RETURNING *',
      [table_name, id]
    );
    return rows[0];
  }

  /** Soft-delete: mark inactive instead of removing to preserve order history */
  static async delete(id) {
    await db.query('UPDATE dining_tables SET is_active = false WHERE id = $1', [id]);
    return true;
  }
}

module.exports = TableModel;
