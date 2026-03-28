const db = require('../config/db');

async function up() {
  try {
    console.log('🔄 Adding phone column to users table...');
    
    // Check if phone column already exists
    const checkResult = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'phone'
    `);
    
    if (checkResult.rows.length === 0) {
      // Add phone column if it doesn't exist
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN phone VARCHAR(20) UNIQUE
      `);
      console.log('✅ Phone column added successfully');
    } else {
      console.log('ℹ️ Phone column already exists');
    }
    
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function down() {
  try {
    console.log('🔄 Removing phone column from users table...');
    
    // Remove phone column
    await db.query(`
      ALTER TABLE users 
        DROP COLUMN IF EXISTS phone
    `);
    
    console.log('✅ Phone column removed successfully');
    console.log('✅ Rollback completed successfully');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

module.exports = { up, down };
