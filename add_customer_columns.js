const dns = require('dns');
// Force Node to prefer IPv4 over IPv6 to fix ENETUNREACH errors
dns.setDefaultResultOrder('ipv4first');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function migrate() {
  try {
    console.log('Adding customer_name and customer_phone to orders table...');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone varchar(20);');

    // Also make table_id optional
    await pool.query('ALTER TABLE orders ALTER COLUMN table_id DROP NOT NULL;');

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
