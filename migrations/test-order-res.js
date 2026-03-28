const OrderModel = require('./models/orderModel');
const db = require('./config/db');

async function check() {
  try {
    // Find the latest order 
    const { rows: latest } = await db.query('SELECT id FROM orders ORDER BY id DESC LIMIT 1');
    if (latest.length === 0) { console.log('No orders'); return; }
    const orderId = latest[0].id;
    const data = await OrderModel.findById(orderId);
    console.log('Order Details:', JSON.stringify(data, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
