const db = require('../config/db');

class OrderModel {
  static async getAll() {
    const { rows } = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    return rows;
  }

  static async findById(id) {
    const { rows } = await db.query(
      'SELECT o.*, (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id) as items FROM orders o WHERE id = $1',
      [id]
    );
    return rows[0];
  }

  static async getOrdersByTable(tableId) {
    const { rows } = await db.query(
      'SELECT o.*, (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id) as items FROM orders o WHERE table_id = $1 ORDER BY created_at DESC',
      [tableId]
    );
    return rows;
  }

  static async createOrder({ table_id, items, note }) {
    try {
      await db.query('BEGIN');
      const { rows: orderRows } = await db.query(
        'INSERT INTO orders (table_id, note) VALUES ($1, $2) RETURNING *',
        [table_id, note]
      );
      const orderId = orderRows[0].id;
      let totalAmount = 0;
      for (const item of items) {
        const { product_id, quantity, unit_price } = item;
        await db.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
          [orderId, product_id, quantity, unit_price]
        );
        totalAmount += quantity * unit_price;
      }
      await db.query('UPDATE orders SET total_amount = $1 WHERE id = $2', [totalAmount, orderId]);
      await db.query('UPDATE dining_tables SET table_status = \'occupied\' WHERE id = $1', [table_id]);
      await db.query('COMMIT');
      return { ...orderRows[0], total_amount: totalAmount };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  static async updateStatus(id, status) {
    try {
      await db.query('BEGIN');
      const { rows } = await db.query(
        'UPDATE orders SET order_status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );
      await db.query('INSERT INTO order_logs (order_id, status) VALUES ($1, $2)', [id, status]);
      if (status === 'paid' || status === 'cancelled') {
        const { rows: tableRows } = await db.query('SELECT table_id FROM orders WHERE id = $1', [id]);
        if (tableRows.length > 0) {
          await db.query('UPDATE dining_tables SET table_status = \'empty\' WHERE id = $1', [tableRows[0].table_id]);
        }
      }
      await db.query('COMMIT');
      return rows[0];
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  static async delete(id) {
    await db.query('DELETE FROM orders WHERE id = $1', [id]);
    return true;
  }
}

module.exports = OrderModel;
