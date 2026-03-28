const db = require('../config/db');

async function up() {
  try {
    console.log('🔄 Adding shipping_address column to orders table...');
    
    // Check if column already exists
    const checkResult = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'shipping_address'
    `);
    
    if (checkResult.rows.length === 0) {
      // Add shipping_address column
      await db.query(`
        ALTER TABLE orders 
        ADD COLUMN shipping_address TEXT
      `);
      console.log('✅ shipping_address column added successfully');
    } else {
      console.log('ℹ️ shipping_address column already exists');
    }
    
    console.log('✅ Migration completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function down() {
  try {
    console.log('🔄 Removing shipping_address column from orders table...');
    
    await db.query(`
      ALTER TABLE orders 
      DROP COLUMN IF EXISTS shipping_address
    `);
    
    console.log('✅ Rollback completed');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

module.exports = { up, down };
