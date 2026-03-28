const db = require('./config/db');

async function check() {
  try {
    const res = await db.query(`
      SELECT column_name, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'push_subscriptions'
    `);
    console.table(res.rows);
  } catch (err) {
    console.error(err.message);
  } finally {
    process.exit();
  }
}

check();
