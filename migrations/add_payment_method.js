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
    console.log('Adding payment_method to orders table...');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method varchar(50);');

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
