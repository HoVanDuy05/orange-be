const db = require('../config/db');

class CategoryModel {
  static async getAll() {
    const { rows } = await db.query('SELECT * FROM categories ORDER BY id DESC');
    return rows;
  }

  static async findById(id) {
    const { rows } = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
    return rows[0];
  }

  static async findByName(name) {
    const { rows } = await db.query('SELECT * FROM categories WHERE category_name = $1', [name]);
    return rows[0];
  }

  static async create({ category_name, description }) {
    const { rows } = await db.query(
      'INSERT INTO categories (category_name, description) VALUES ($1, $2) RETURNING *',
      [category_name, description]
    );
    return rows[0];
  }

  static async update(id, { category_name, description, is_active }) {
    const { rows } = await db.query(
      'UPDATE categories SET category_name = $1, description = $2, is_active = $3 WHERE id = $4 RETURNING *',
      [category_name, description, is_active, id]
    );
    return rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM categories WHERE id = $1', [id]);
    return true;
  }
}

module.exports = CategoryModel;
