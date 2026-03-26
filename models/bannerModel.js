const db = require('../config/db');

class BannerModel {
  static async getAll() {
    const { rows } = await db.query('SELECT * FROM banners WHERE is_active = true ORDER BY id ASC');
    return rows;
  }

  static async create({ title, image_url, redirect_url }) {
    const { rows } = await db.query(
      'INSERT INTO banners (title, image_url, redirect_url) VALUES ($1, $2, $3) RETURNING *',
      [title, image_url, redirect_url]
    );
    return rows[0];
  }

  static async update(id, { title, image_url, redirect_url, is_active }) {
    const { rows } = await db.query(
      'UPDATE banners SET title = $1, image_url = $2, redirect_url = $3, is_active = $4 WHERE id = $5 RETURNING *',
      [title, image_url, redirect_url, is_active, id]
    );
    return rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM banners WHERE id = $1', [id]);
    return true;
  }
}

module.exports = BannerModel;
