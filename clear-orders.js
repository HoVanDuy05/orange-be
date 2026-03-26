require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false } // Required for Supabase
});

async function clearOrders() {
  try {
    console.log('🗑️ Đang xóa toàn bộ dữ liệu đơn hàng (giữ lại Sản phẩm, Danh mục, Tài khoản)...');
    
    // TRUNCATE CASCADE sẽ tự động xóa các bảng phụ thuộc (order_items, payments, order_logs)
    await pool.query('TRUNCATE TABLE orders CASCADE');
    console.log('✅ Đã xóa toàn bộ dữ liệu bảng: orders, order_items, payments, order_logs');

    // Chuyển tất cả các bàn về trạng thái trống
    await pool.query("UPDATE dining_tables SET table_status = 'empty'");
    console.log('✅ Đã dọn dẹp và làm trống toàn bộ Bàn Ăn');

    console.log('🎉 XÓA DỮ LIỆU ĐƠN HÀNG THÀNH CÔNG!');
  } catch (error) {
    console.error('❌ Lỗi xóa dữ liệu:', error);
  } finally {
    pool.end();
  }
}

clearOrders();
