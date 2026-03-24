const db = require('../config/db');

class ProductModel {
  static async getAll(categoryId = null) {
    let sql = `
      SELECT 
        p.*,
        COALESCE(SUM(oi.quantity), 0) AS sales_count
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      WHERE p.is_active = true
    `;
    const params = [];
    if (categoryId) {
      sql += ' AND p.category_id = $1';
      params.push(categoryId);
    }
    sql += ' GROUP BY p.id ORDER BY p.created_at DESC, p.id DESC';
    const { rows } = await db.query(sql, params);
    return rows;
  }

  static async findById(id) {
    const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    return rows[0];
  }

  static async create({ product_name, description, price, image_url, category_id, discount_price }) {
    const { rows } = await db.query(
      'INSERT INTO products (product_name, description, price, image_url, category_id, discount_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [product_name, description, price, image_url, category_id, discount_price]
    );
    return rows[0];
  }

  static async update(id, { product_name, description, price, image_url, category_id, is_active, discount_price }) {
    const { rows } = await db.query(
      'UPDATE products SET product_name = $1, description = $2, price = $3, image_url = $4, category_id = $5, is_active = $6, discount_price = $7 WHERE id = $8 RETURNING *',
      [product_name, description, price, image_url, category_id, is_active, discount_price, id]
    );
    return rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM products WHERE id = $1', [id]);
    return true;
  }
}

module.exports = ProductModel;
