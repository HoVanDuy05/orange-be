const db = require('../config/db');

class StockModel {
  static async getAll() {
    const { rows } = await db.query('SELECT *, (quantity * unit_price) as cost FROM stock_in ORDER BY stock_date DESC');
    return rows;
  }

  static async getHistory(stockId) {
    const { rows } = await db.query('SELECT * FROM stock_history WHERE stock_id = $1 ORDER BY change_date DESC', [stockId]);
    return rows;
  }

  static async create({ item_name, quantity, unit_price, supplier, stock_date, buyer_name, unit }) {
    const { rows } = await db.query(
      'INSERT INTO stock_in (item_name, quantity, unit_price, supplier, stock_date, buyer_name, unit) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [item_name, Number(quantity), Number(unit_price), supplier, stock_date || new Date(), buyer_name || 'Admin', unit || 'Kg']
    );
    return rows[0];
  }

  static async update(id, { item_name, quantity, unit_price, supplier, stock_date, buyer_name, unit, updated_by }) {
    // 1. Lưu bản ghi cũ vào lịch sử kèm thông tin NGƯỜI SỬA
    await db.query(`
      INSERT INTO stock_history (stock_id, old_item_name, old_quantity, old_unit_price, old_unit, old_buyer_name, old_supplier, old_stock_date, updated_by)
      SELECT id, item_name, quantity, unit_price, unit, buyer_name, supplier, stock_date, $2 FROM stock_in WHERE id = $1
    `, [id, updated_by || 'Hệ thống']);

    // 2. Cập nhật bản ghi mới vào bảng chính
    const { rows } = await db.query(
      'UPDATE stock_in SET item_name = $1, quantity = $2, unit_price = $3, supplier = $4, stock_date = $5, buyer_name = $6, unit = $7, updated_at = NOW() WHERE id = $8 RETURNING *',
      [item_name, Number(quantity), Number(unit_price), supplier, stock_date, buyer_name, unit, id]
    );
    return rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM stock_in WHERE id = $1', [id]);
    return true;
  }
}

module.exports = StockModel;
