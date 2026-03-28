const db = require('./config/db');

async function check() {
  try {
    const res = await db.query(`
      SELECT conname, contype, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'push_subscriptions'::regclass;
    `);
    console.table(res.rows);
  } catch (err) {
    console.error(err.message);
  } finally {
    process.exit();
  }
}

check();
