const db = require('../config/db');

class ProductModel {
  static async getAll(categoryId = null) {
    let sql = 'SELECT * FROM products WHERE is_active = true';
    const params = [];
    if (categoryId) {
      sql += ' AND category_id = $1';
      params.push(categoryId);
    }
    sql += ' ORDER BY id ASC';
    const { rows } = await db.query(sql, params);
    return rows;
  }

  static async findById(id) {
    const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    return rows[0];
  }

  static async create({ product_name, description, price, image_url, category_id }) {
    const { rows } = await db.query(
      'INSERT INTO products (product_name, description, price, image_url, category_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [product_name, description, price, image_url, category_id]
    );
    return rows[0];
  }

  static async update(id, { product_name, description, price, image_url, category_id, is_active }) {
    const { rows } = await db.query(
      'UPDATE products SET product_name = $1, description = $2, price = $3, image_url = $4, category_id = $5, is_active = $6 WHERE id = $7 RETURNING *',
      [product_name, description, price, image_url, category_id, is_active, id]
    );
    return rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM products WHERE id = $1', [id]);
    return true;
  }
}

module.exports = ProductModel;
