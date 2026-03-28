const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const db = require('./config/db');

async function migrate() {
  try {
    // 1. Create Branches Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        address TEXT,
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Created branches table');

    // 2. Add branch_id to users & orders
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id) ON DELETE SET NULL;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id) ON DELETE SET NULL;
    `);
    console.log('✅ Added branch_id to users and orders');

    // 3. Create Brand Themes Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS brand_themes (
        id SERIAL PRIMARY KEY,
        target_type VARCHAR(50) DEFAULT 'client', -- 'admin' or 'client'
        brand_name VARCHAR(150) NOT NULL,
        logo_url TEXT,
        primary_color VARCHAR(20) DEFAULT '#FF6B00',
        secondary_color VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Seed default theme if none exists
    const res = await db.query(`SELECT COUNT(*) FROM brand_themes`);
    if (parseInt(res.rows[0].count) === 0) {
      await db.query(`
        INSERT INTO brand_themes (target_type, brand_name, primary_color) VALUES 
        ('admin', 'Orange Cafe Admin', '#FF6B00'),
        ('client', 'Orange Cafe', '#FF6B00');
      `);
      console.log('✅ Seeded default brand_themes');
    }

    // Seed default branch if none exists
    const branchRes = await db.query(`SELECT COUNT(*) FROM branches`);
    if (parseInt(branchRes.rows[0].count) === 0) {
      await db.query(`
        INSERT INTO branches (name, address) VALUES 
        ('Chi nhánh Trung Tâm (Quận 1)', '123 Đường Trung Tâm, Q.1, TP.HCM');
      `);
      console.log('✅ Seeded default branch');
    }
    
    console.log('🎉 Migration run completed successfully!');
  } catch (err) {
    console.error('❌ Error during migration:', err);
  } finally {
    process.exit();
  }
}

migrate();
