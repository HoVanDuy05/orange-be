const db = require('../config/db');

class UserModel {
  static async findByEmail(email) {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await db.query('SELECT id, full_name, email, role FROM users WHERE id = $1', [id]);
    return rows[0];
  }

  static async create({ full_name, email, password_hash, role }) {
    const { rows } = await db.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role',
      [full_name, email, password_hash, role]
    );
    return rows[0];
  }
}

module.exports = UserModel;
