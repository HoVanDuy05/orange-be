const db = require('./config/db');
async function run() {
  try {
    const { rows } = await db.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'products\'');
    console.log('Products columns:', rows);
    process.exit(0);
  } catch (err) { console.error(err); process.exit(1); }
}
run();
