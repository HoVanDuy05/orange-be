const db = require('./config/db');

async function test() {
  try {
    console.log('1. Checking phone column exists...');
    const r = await db.query(`SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone'`);
    console.log('   Phone column exists:', r.rows.length > 0);
    
    console.log('2. Testing SELECT with phone...');
    const r2 = await db.query('SELECT phone FROM users LIMIT 1');
    console.log('   Query success, rows:', r2.rows.length);
    console.log('   Sample data:', r2.rows[0]);
    
    console.log('3. Testing UserModel.findByPhone...');
    const UserModel = require('./models/userModel');
    const user = await UserModel.findByPhone('0912345678');
    console.log('   User found:', user || 'No user (expected for new phone)');
    
    console.log('\nAll tests passed!');
  } catch(e) {
    console.error('\nError:', e.message);
    console.error('Stack:', e.stack);
  }
  process.exit(0);
}

test();
