const db = require('../config/db');

class TableModel {
  static async getAll() {
    const { rows } = await db.query('SELECT * FROM dining_tables ORDER BY id ASC');
    return rows;
  }

  static async findById(id) {
    const { rows } = await db.query('SELECT * FROM dining_tables WHERE id = $1', [id]);
    return rows[0];
  }

  static async create(name) {
    const { rows } = await db.query(
      'INSERT INTO dining_tables (table_name) VALUES ($1) RETURNING *',
      [name]
    );
    return rows[0];
  }

  static async update(id, name) {
    const { rows } = await db.query(
      'UPDATE dining_tables SET table_name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    return rows[0];
  }

  static async updateStatus(id, status) {
    const { rows } = await db.query(
      'UPDATE dining_tables SET table_status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM dining_tables WHERE id = $1', [id]);
    return true;
  }
}

module.exports = TableModel;
