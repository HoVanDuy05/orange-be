const db = require('./config/db');
async function run() {
  try {
    const { rows } = await db.query('SELECT id, product_name, image_url FROM products WHERE id = 9');
    console.log('Result for ID 9:', rows);
    const { rows: all } = await db.query('SELECT count(*) FROM products');
    console.log('Total products:', all[0].count);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
