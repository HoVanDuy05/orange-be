const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  keepAlive: true,
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  }
});

pool.on('connect', (client) => {
  client.query('SET TIME ZONE \'Asia/Ho_Chi_Minh\'');
  console.log('PostgreSQL Connected & Timezone set to VN (+7)');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
