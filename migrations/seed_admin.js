const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  try {
    const email = 'vanduyho717@gmail.com';
    const password = 'hovanduy2005';
    
    // Check if user exists
    const checkUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    if (checkUser.rows.length > 0) {
      // Update
      await db.query("UPDATE users SET password_hash = $1, role = 'admin', full_name = 'Ho Van Duy' WHERE email = $2", [hash, email]);
      console.log('✅ Đã cập nhật mật khẩu và quyền admin cho tải khoản:', email);
    } else {
      // Insert
      await db.query("INSERT INTO users (email, password_hash, role, full_name) VALUES ($1, $2, 'admin', 'Ho Van Duy')", [email, hash]);
      console.log('✅ Đã tạo tài khoản admin mới:', email);
    }
  } catch (err) {
    console.error('Lỗi khởi tạo tài khoản:', err);
  } finally {
    process.exit();
  }
}

seedAdmin();
