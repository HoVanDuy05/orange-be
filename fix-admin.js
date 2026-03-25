const dns = require('dns');
// Force Node to prefer IPv4 over IPv6 to fix ENETUNREACH errors
dns.setDefaultResultOrder('ipv4first');
const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function fixPassword() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('admin123', salt);

  await db.query("UPDATE users SET password_hash = $1 WHERE email = 'admin@iuh.edu.vn'", [hash]);
  console.log('✅ Da fix mat khau cho admin@iuh.edu.vn thanh: admin123');
  process.exit();
}
fixPassword();
