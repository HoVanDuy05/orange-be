const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const db = require('../config/db');

async function migrate() {
  try {
    // Check if table exists
    const checkTable = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'media_library'
      );
    `);

    if (!checkTable.rows[0].exists) {
      await db.query(`
        CREATE TABLE media_library (
          id SERIAL PRIMARY KEY,
          url TEXT NOT NULL,
          public_id TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Created media_library table');
    } else {
      console.log('ℹ️ media_library table already exists');
    }

    console.log('🎉 Media Migration completed!');
  } catch (err) {
    console.error('❌ Error during media migration:', err);
  } finally {
    process.exit();
  }
}

migrate();
