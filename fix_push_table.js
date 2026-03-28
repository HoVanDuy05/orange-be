const db = require('./config/db');

async function migrate() {
  try {
    console.log('🚀 Starting migration: Add customer_phone to push_subscriptions...');
    
    await db.query(`
      ALTER TABLE push_subscriptions 
      ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
    `);

    console.log('✅ Added customer_phone to push_subscriptions');
    console.log('🎉 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Error during migration:', err);
  } finally {
    process.exit();
  }
}

migrate();
