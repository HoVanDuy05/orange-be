const db = require('./config/db');

async function seedData() {
  try {
    console.log('--- Đang tạo dữ liệu mẫu ---');

    console.log('Inserting Admin User...');
    const { rows: users } = await db.query("SELECT * FROM users WHERE email = 'admin@iuh.edu.vn'");
    if (users.length === 0) {
      await db.query(`
        INSERT INTO users (full_name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
      `, ['Quản trị viên', 'admin@iuh.edu.vn', '$2b$10$tM78wA0h/oNtzRzY/aHwL.f61R5aXyB2O/kSihWc5rKzJRYT4aEpe', 'admin']);
    }

    console.log('Inserting Tables...');
    const tables = ['Bàn 1', 'Bàn 2', 'Bàn 3', 'Bàn VIP 1'];
    for (let t of tables) {
      await db.query(`
        INSERT INTO dining_tables (table_name, table_status) 
        VALUES ($1, 'empty') 
        ON CONFLICT DO NOTHING
      `, [t]);
    }

    console.log('Inserting Categories...');
    await db.query(`
      INSERT INTO categories (category_name, description) 
      VALUES 
        ('Đồ ăn', 'Các món ăn chính'),
        ('Thức uống', 'Giải khát'),
        ('Dessert', 'Tráng miệng')
      ON CONFLICT DO NOTHING
    `);

    console.log('Inserting Products...');
    const { rows: foodCats } = await db.query("SELECT id FROM categories WHERE category_name = 'Đồ ăn' LIMIT 1");
    const { rows: drinkCats } = await db.query("SELECT id FROM categories WHERE category_name = 'Thức uống' LIMIT 1");
    
    if (foodCats.length > 0 && drinkCats.length > 0) {
      const foodId = foodCats[0].id;
      const drinkId = drinkCats[0].id;
      
      await db.query(`
        INSERT INTO products (category_id, product_name, description, price, image_url) 
        VALUES 
          ($1, 'Bún Cơm', 'Món ăn đặc sản, thơm ngon đậm vị.', 45000, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=600'),
          ($1, 'Cơm Sinh Viên', 'Cơm phần siêu to khổng lồ dành cho IUHer.', 25000, 'https://images.unsplash.com/photo-1615486171500-1c5c1cb12c75?auto=format&fit=crop&q=80&w=600'),
          ($2, 'Trà Đá Tầng 1', 'Mát lạnh giải nhiệt.', 5000, 'https://images.unsplash.com/photo-1499638472904-ea5c6178a300?auto=format&fit=crop&q=80&w=600'),
          ($2, 'Cà Phê Sữa Đá', 'Cà phê nguyên chất, thức tỉnh học tập.', 20000, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=600')
        ON CONFLICT DO NOTHING
      `, [foodId, drinkId]);
    }

    console.log('✅ Chạy dữ liệu mẫu THÀNH CÔNG!');
  } catch (err) {
    console.error('Lỗi khi chạy dữ liệu mẫu:', err);
  } finally {
    process.exit();
  }
}

seedData();
