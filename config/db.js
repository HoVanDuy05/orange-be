const { Pool } = require('pg');
const dns = require('dns');
const logger = require('./logger');
require('dotenv').config();

dns.setDefaultResultOrder('ipv4first');

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
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  lookup: (hostname, options, callback) => {
    // Force direct IPv4 resolution to skip IPv6 entirely
    dns.resolve4(hostname, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        // Fallback to dns.lookup with strict family check for localhost or if resolve4 fails
        dns.lookup(hostname, { family: 4 }, (lookupErr, address) => {
          if (lookupErr) {
            logger.error(`DNS resolve4/lookup failed for ${hostname}`, lookupErr);
            return callback(lookupErr);
          }
          callback(null, address, 4);
        });
      } else {
        // Use the first IPv4 address returned
        callback(null, addresses[0], 4);
      }
    });
  }
});

pool.on('connect', (client) => {
  client.query("SET TIME ZONE 'Asia/Ho_Chi_Minh'");
  logger.info('PostgreSQL Connected & Timezone: Asia/Ho_Chi_Minh (+7)');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle DB client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
