const db = require('./config/db');

async function test() {
  try {
    const res = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('--- TABLES IN DATABASE ---');
    if (res.rows.length === 0) {
      console.log('No tables found in public schema.');
    } else {
      res.rows.forEach(row => console.log('+', row.table_name));
    }
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    process.exit();
  }
}

test();
