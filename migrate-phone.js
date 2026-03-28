const db = require('./config/db');

async function addPhoneColumn() {
  try {
    console.log('🔍 Checking if phone column exists in public.users...');
    
    const check = await db.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'phone'
    `);
    
    if (check.rows.length > 0) {
      console.log('✅ Phone column already exists in public.users');
    } else {
      console.log('📝 Adding phone column to public.users...');
      await db.query('ALTER TABLE users ADD COLUMN phone VARCHAR(20) UNIQUE');
      console.log('✅ Phone column added successfully!');
    }
    
    console.log('\n📋 Current columns in public.users:');
    const cols = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    cols.rows.forEach(c => console.log(`   - ${c.column_name}: ${c.data_type}`));
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
  process.exit(0);
}

addPhoneColumn();
