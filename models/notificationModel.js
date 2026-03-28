const db = require('../config/db');

class NotificationModel {
  static async getAll({ unreadOnly = false, limit = 50, page = 1 } = {}) {
    const offset = (page - 1) * limit;
    let sql = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];
    let idx = 1;

    if (unreadOnly) {
      sql += ` AND is_read = false`;
    }

    // Count total
    const countSql = `SELECT COUNT(*) as total FROM notifications WHERE ${unreadOnly ? 'is_read = false' : '1=1'}`;
    const countRes = await db.query(countSql);
    const total = parseInt(countRes.rows[0].total);

    sql += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const { rows } = await db.query(sql, params);
    return {
      notifications: rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async create({ type, title, message, link }) {
    const { rows } = await db.query(
      'INSERT INTO notifications (type, title, message, link) VALUES ($1, $2, $3, $4) RETURNING *',
      [type || 'info', title, message || null, link || null]
    );
    return rows[0];
  }

  static async markRead(id) {
    const { rows } = await db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0];
  }

  static async markAllRead() {
    await db.query('UPDATE notifications SET is_read = true');
    return true;
  }

  static async delete(id) {
    await db.query('DELETE FROM notifications WHERE id = $1', [id]);
    return true;
  }

  static async clearAll() {
    await db.query('DELETE FROM notifications');
    return true;
  }
}

module.exports = NotificationModel;
