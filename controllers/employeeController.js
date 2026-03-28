const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getEmployees = async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT u.id, u.full_name, u.email, u.role, u.branch_id, b.name as branch_name 
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.role IN ('staff', 'admin')
      ORDER BY u.id ASC
    `);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const { full_name, email, password, role, branch_id } = req.body;
    
    // Check if email exists
    const checkEx = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (checkEx.rows.length > 0) return res.status(400).json({ message: 'Email đã tồn tại' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password || '123456', salt);

    await db.query(`
      INSERT INTO users (full_name, email, password_hash, role, branch_id)
      VALUES ($1, $2, $3, $4, $5)
    `, [full_name, email, hash, role || 'staff', branch_id]);

    res.status(201).json({ message: 'Thêm nhân viên thành công' });
  } catch (err) { next(err); }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, email, role, branch_id, password } = req.body;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      await db.query(`
        UPDATE users SET full_name=$1, email=$2, role=$3, branch_id=$4, password_hash=$5 WHERE id=$6
      `, [full_name, email, role, branch_id, hash, id]);
    } else {
      await db.query(`
        UPDATE users SET full_name=$1, email=$2, role=$3, branch_id=$4 WHERE id=$5
      `, [full_name, email, role, branch_id, id]);
    }

    res.json({ message: 'Cập nhật nhân viên thành công' });
  } catch (err) { next(err); }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM users WHERE id=$1', [id]);
    res.json({ message: 'Xóa nhân viên thành công' });
  } catch (err) { next(err); }
};
