const db = require('./config/db');
const bcrypt = require('bcryptjs');
const UserModel = require('./models/userModel');

async function test() {
  try {
    console.log('1. Test findByPhone...');
    try {
      const existing = await UserModel.findByPhone('0909999999');
      console.log('   findByPhone result:', existing || 'null (phone not used)');
    } catch(e) {
      console.error('   findByPhone ERROR:', e.message);
      console.error('   Stack:', e.stack);
    }
    
    console.log('\n2. Test create user...');
    try {
      const password_hash = await bcrypt.hash('123456', 12);
      console.log('   Password hashed');
      
      const user = await UserModel.create({
        full_name: 'Test User',
        email: null,
        phone: '0909999999',
        password_hash,
        role: 'user'
      });
      console.log('   User created:', user);
    } catch(e) {
      console.error('   create ERROR:', e.message);
      console.error('   Stack:', e.stack);
    }
    
  } catch(e) {
    console.error('General error:', e);
  }
  process.exit(0);
}

test();
