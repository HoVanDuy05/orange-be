const db = require('./config/db');

async function test() {
  try {
    console.log('1. Current database and schema...');
    const r1 = await db.query('SELECT current_database(), current_schema()');
    console.log('   DB:', r1.rows[0]);
    
    console.log('2. Search path...');
    const r2 = await db.query('SHOW search_path');
    console.log('   Search path:', r2.rows[0]);
    
    console.log('3. All tables named users in any schema...');
    const r3 = await db.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'users'
    `);
    console.log('   Tables:', r3.rows);
    
    console.log('4. Phone columns in any schema...');
    const r4 = await db.query(`
      SELECT table_schema, table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'phone'
    `);
    console.log('   Phone columns:', r4.rows);
    
    console.log('5. Try explicit schema...');
    try {
      const r5 = await db.query('SELECT phone FROM public.users LIMIT 1');
      console.log('   public.users query OK, rows:', r5.rows.length);
    } catch(e) {
      console.log('   public.users error:', e.message);
    }
    
    console.log('6. Try auth schema...');
    try {
      const r6 = await db.query('SELECT phone FROM auth.users LIMIT 1');
      console.log('   auth.users query OK, rows:', r6.rows.length);
    } catch(e) {
      console.log('   auth.users error:', e.message);
    }
    
  } catch(e) {
    console.error('\nError:', e.message);
  }
  process.exit(0);
}

test();
