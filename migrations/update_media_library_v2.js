const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const db = require('../config/db');

async function migrate() {
  try {
    // Add 'folder' column to media_library
    await db.query(`
      ALTER TABLE media_library ADD COLUMN IF NOT EXISTS folder VARCHAR(50) DEFAULT 'uncategorized';
    `);
    console.log('✅ Added folder column to media_library');

    console.log('🎉 Migration run completed successfully!');
  } catch (err) {
    console.error('❌ Error during migration:', err);
  } finally {
    process.exit();
  }
}

migrate();
