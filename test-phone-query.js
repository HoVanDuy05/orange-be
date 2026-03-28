const db = require('./config/db');

async function test() {
  try {
    console.log('Test 1: Simple phone query...');
    const result1 = await db.query('SELECT phone FROM users LIMIT 1');
    console.log('✅ Success:', result1.rows);
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
  
  try {
    console.log('\nTest 2: SELECT with phone filter...');
    const result2 = await db.query('SELECT * FROM users WHERE phone = $1', ['test']);
    console.log('✅ Success:', result2.rows.length, 'rows');
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
  
  try {
    console.log('\nTest 3: Check search_path...');
    const result3 = await db.query('SHOW search_path');
    console.log('Search path:', result3.rows[0]);
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
  
  process.exit(0);
}

test();
