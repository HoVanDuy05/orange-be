// Seed banners
require('dotenv').config();
const { Pool } = require('pg');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: Number(process.env.DB_PORT) || 5432,
  ssl: { rejectUnauthorized: false },
  lookup: (hostname, options, callback) => {
    dns.resolve4(hostname, (err, addresses) => {
      if (err || !addresses || !addresses.length) {
        dns.lookup(hostname, { family: 4 }, callback);
      } else {
        callback(null, addresses[0], 4);
      }
    });
  }
});

async function seed() {
  try {
    await pool.query('DELETE FROM banners');
    await pool.query(`
      INSERT INTO banners (title, image_url, redirect_url) VALUES 
      ('Chào mừng đến với IUH Food Court', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200', '/menu'),
      ('Ưu đãi 20% cho sinh viên năm nhất', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1200', '/menu'),
      ('Thử ngay Special Ramen mới!', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=1200', '/menu')
    `);
    console.log('✅ Banners seeded successfully');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    process.exit(0);
  }
}

seed();
