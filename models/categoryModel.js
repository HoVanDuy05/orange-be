const db = require('../config/db');

class CategoryModel {
  static async getAll() {
    const { rows } = await db.query(`
      SELECT *, 'ORANGE-DM-' || lpad(id::text, 2, '0') AS category_code FROM categories ORDER BY id ASC
    `);
    return rows;
  }

  static async findById(id) {
    const { rows } = await db.query(`
      SELECT *, 'ORANGE-DM-' || lpad(id::text, 2, '0') AS category_code FROM categories WHERE id = $1
    `, [id]);
    return rows[0];
  }

  static async findByName(name) {
    const { rows } = await db.query('SELECT * FROM categories WHERE category_name = $1', [name]);
    return rows[0];
  }

  static async create({ category_name, description, image_url }) {
    const { rows } = await db.query(
      'INSERT INTO categories (category_name, description, image_url) VALUES ($1, $2, $3) RETURNING *',
      [category_name, description || null, image_url || null]
    );
    return rows[0];
  }

  static async update(id, { category_name, description, is_active, image_url }) {
    const { rows } = await db.query(
      'UPDATE categories SET category_name = $1, description = $2, is_active = $3, image_url = $4 WHERE id = $5 RETURNING *',
      [category_name, description, is_active ?? true, image_url || null, id]
    );
    return rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM categories WHERE id = $1', [id]);
    return true;
  }
}

module.exports = CategoryModel;
