// Migration: Add indexes for better performance on search and common queries
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

async function migrate() {
  try {
    console.log('⏳ Running performance migration...');
    
    // Index for simple search
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_name_btree ON products (product_name);');
    
    // Index for status filtering (very common)
    await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (order_status);');
    
    // Index for table-based queries (POS, real-time)
    await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders (table_id);');
    
    // Index for date filtering (stats)
    await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);');

    console.log('✅ Performance indexes applied.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    process.exit(0);
  }
}

migrate();
