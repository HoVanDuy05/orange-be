const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config();

const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, error) => console.error(`[ERROR] ${msg}`, error.message || error)
};

async function testConnection() {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: {
      rejectUnauthorized: false
    },
    max: 1,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
    application_name: 'connection_test'
  });

  try {
    logger.info('Testing database connection...');
    const start = Date.now();
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    const duration = Date.now() - start;

    logger.info('✅ Database connection successful!', {
      duration: `${duration}ms`,
      currentTime: result.rows[0].current_time,
      version: result.rows[0].version.split(' ')[0]
    });

    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  testConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testConnection };
