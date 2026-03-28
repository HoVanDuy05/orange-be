const db = require('./config/db');

async function check() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'push_subscriptions'
    `);
    console.log('--- PUSH_SUBSCRIPTIONS COLUMNS ---');
    console.table(res.rows);
  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    process.exit();
  }
}

check();
