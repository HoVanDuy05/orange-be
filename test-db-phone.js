const db = require('./config/db');

async function test() {
  try {
    console.log('Testing DB connection...');
    const result = await db.query('SELECT NOW()');
    console.log('DB connected:', result.rows[0]);
    
    console.log('\nTesting phone column...');
    const cols = await db.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'phone'
    `);
    console.log('Phone column exists:', cols.rows.length > 0);
    
    console.log('\nTesting findByPhone...');
    const user = await db.query('SELECT * FROM users WHERE phone = $1', ['0912345678']);
    console.log('User found:', user.rows[0] || 'No user');
    
    console.log('\nTesting UserModel...');
    const UserModel = require('./models/userModel');
    const existing = await UserModel.findByPhone('0912345678');
    console.log('UserModel.findByPhone result:', existing || 'No user found');
    
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  }
  process.exit(0);
}

test();
