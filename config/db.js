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
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 1000,
  application_name: 'orange_backend',
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

pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle DB client', err);
  if (client) {
    logger.error('Client connection details', {
      host: client.host,
      port: client.port,
      database: client.database,
      user: client.user
    });
  }
});

pool.on('acquire', (client) => {
  logger.debug('Client acquired from pool');
});

pool.on('remove', (client) => {
  logger.debug('Client removed from pool');
});

module.exports = {
  query: async (text, params) => {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      if (duration > 1000) {
        logger.warn(`Slow query detected: ${duration}ms`, {
          query: text.substring(0, 100),
          paramCount: params?.length || 0
        });
      }
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`Query failed after ${duration}ms`, {
        query: text.substring(0, 100),
        error: error.message,
        code: error.code
      });
      throw error;
    }
  },
  pool: pool
};
