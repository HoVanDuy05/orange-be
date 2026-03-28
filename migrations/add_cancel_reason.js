// Migration: Add cancel_reason column to orders table
// Run once: node add_cancel_reason.js

const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config();

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

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
    `);
    console.log('✅ Column cancel_reason added to orders (or already exists).');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
