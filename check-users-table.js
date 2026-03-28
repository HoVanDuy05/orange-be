const db = require('./config/db');

async function checkTable() {
  try {
    console.log('Checking actual table structure...\n');
    
    // Get all columns from users table
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    console.log('\nChecking if phone column exists...');
    const phoneCol = result.rows.find(c => c.column_name === 'phone');
    if (phoneCol) {
      console.log('✅ Phone column exists:', phoneCol);
    } else {
      console.log('❌ Phone column NOT found!');
      console.log('\nAttempting to add phone column...');
      try {
        await db.query('ALTER TABLE users ADD COLUMN phone VARCHAR(20) UNIQUE');
        console.log('✅ Phone column added successfully!');
      } catch (e) {
        console.error('❌ Failed to add phone column:', e.message);
      }
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
}

checkTable();
