const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function clearData() {
  try {
    console.log('Đang xóa NGHIÊM NGẶT TOÀN BỘ dữ liệu ngoại trừ bảng Users (để giữ tài khoản Admin)...');
    
    await pool.query('BEGIN');
    
    // TRUNCATE tất cả CASCADE
    console.log('- Xóa orders, order_items, order_logs, payments...');
    await pool.query('TRUNCATE TABLE order_logs, order_items, payments, orders CASCADE;');
    
    console.log('- Xóa stock_in, stock_history...');
    await pool.query('TRUNCATE TABLE stock_history, stock_in CASCADE;');
    
    console.log('- Xóa products, categories...');
    await pool.query('TRUNCATE TABLE products, categories CASCADE;');
    
    console.log('- Xóa dining_tables...');
    await pool.query('TRUNCATE TABLE dining_tables CASCADE;');
    
    console.log('- Xóa media_library, banners, settings...');
    await pool.query('TRUNCATE TABLE media_library, banners, settings CASCADE;');
    
    await pool.query('COMMIT');
    
    console.log('✅ Đã dọn sạch DATABASE TẬN GỐC! Chỉ còn lại tài khoản Admin.');
    process.exit(0);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('❌ Lỗi dọn dẹp:', err);
    process.exit(1);
  }
}

clearData();
