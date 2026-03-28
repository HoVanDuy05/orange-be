const db = require('./config/db');

async function migrate() {
  try {
    console.log('🚀 Starting migration: Add font_family to brand_themes...');
    
    await db.query(`
      ALTER TABLE brand_themes 
      ADD COLUMN IF NOT EXISTS font_family VARCHAR(100) DEFAULT 'Be Vietnam Pro';
    `);

    console.log('✅ Added font_family column to brand_themes table');
    console.log('🎉 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Error during migration:', err);
  } finally {
    process.exit();
  }
}

migrate();
