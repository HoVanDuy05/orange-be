const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const db = require('../config/db');

async function migrate() {
  try {
    // Check if push_subscriptions exists
    const checkTable = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'push_subscriptions'
      );
    `);

    if (!checkTable.rows[0].exists) {
      await db.query(`
        CREATE TABLE push_subscriptions (
          id SERIAL PRIMARY KEY,
          customer_phone VARCHAR(20) NOT NULL,
          endpoint TEXT NOT NULL,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX idx_push_phone ON push_subscriptions(customer_phone);
      `);
      console.log('✅ Created push_subscriptions table');
    } else {
      console.log('ℹ️ push_subscriptions table already exists');
    }

    console.log('🎉 Push Migration completed!');
  } catch (err) {
    console.error('❌ Error during push migration:', err);
  } finally {
    process.exit();
  }
}

migrate();
