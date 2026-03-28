require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        customer_phone VARCHAR(50) NOT NULL,
        subscription JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_push_subs_phone ON push_subscriptions(customer_phone);
    `);
    console.log('✅ Bảng push_subscriptions đã được tạo thành công!');
  } catch (error) {
    console.error('❌ Lỗi tạo bảng:', error);
  } finally {
    pool.end();
  }
}

createTable();
