const db = require('../config/db');

class ProductModel {
  static async getAll({ categoryId, search, activeOnly = true } = {}) {
    let sql = `
      SELECT 
        p.*,
        c.category_name,
        COALESCE(
          (SELECT SUM(oi.quantity)
           FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           WHERE oi.product_id = p.id AND o.order_status = 'completed'),
          0
        ) AS sales_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (activeOnly) {
      sql += ` AND p.is_active = true`;
    }
    if (categoryId) {
      sql += ` AND p.category_id = $${idx++}`;
      params.push(categoryId);
    }
    if (search) {
      sql += ` AND p.product_name ILIKE $${idx++}`;
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY p.created_at DESC, p.id DESC';
    const { rows } = await db.query(sql, params);
    return rows;
  }

  static async findById(id) {
    const { rows } = await db.query(`
      SELECT p.*, c.category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = $1
    `, [id]);
    return rows[0] || null;
  }

  static async create({ product_name, description, price, image_url, category_id }) {
    const { rows } = await db.query(
      `INSERT INTO products (product_name, description, price, image_url, category_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [product_name, description || null, Number(price), image_url || null, category_id || null]
    );
    return rows[0];
  }

  static async update(id, { product_name, description, price, image_url, category_id, is_active }) {
    const activeValue = is_active !== undefined ? is_active : true;
    const { rows } = await db.query(
      `UPDATE products
       SET product_name = $1, description = $2, price = $3,
           image_url = $4, category_id = $5, is_active = $6
       WHERE id = $7 RETURNING *`,
      [product_name, description || null, Number(price), image_url || null, category_id || null, activeValue, id]
    );
    return rows[0] || null;
  }

  /** Soft-delete to preserve order_items FK history */
  static async delete(id) {
    await db.query('UPDATE products SET is_active = false WHERE id = $1', [id]);
    return true;
  }
}

module.exports = ProductModel;
