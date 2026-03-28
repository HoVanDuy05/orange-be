const db = require('./config/db');

async function checkAuthUsers() {
  try {
    console.log('Cấu trúc bảng auth.users:');
    const cols = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'auth' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    cols.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(NOT null)'}`);
    });
    
    console.log('\nCấu trúc bảng public.users:');
    const cols2 = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    if (cols2.rows.length === 0) {
      console.log('  (Bảng public.users không tồn tại)');
    } else {
      cols2.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }
    
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
}

checkAuthUsers();
