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

pool.query('SELECT * FROM push_subscriptions')
  .then(r => {
    console.log('Subscriptions:', r.rows);
    pool.end();
  })
  .catch(e => {
    console.error('Error:', e);
    pool.end();
  });
