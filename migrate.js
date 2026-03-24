/**
 * Migration: Thêm các cột mới cho products và seed dữ liệu đơn hàng mẫu
 * Chạy bằng: node migrate.js
 */
const db = require('./config/db');

async function migrate() {
  try {
    console.log('=== BƯỚC 1: CẬP NHẬT SCHEMA ===');

    // Thêm 2 cột mới cho bảng products (nếu chưa có)
    await db.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS discount_price NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS sales_count INT DEFAULT 0;
    `);
    console.log('✅ Bảng products: Đã thêm discount_price, sales_count');

    // Đảm bảo bảng media_library tồn tại
    await db.query(`
      CREATE TABLE IF NOT EXISTS media_library (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        public_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Bảng media_library OK');

    // Đảm bảo bảng order_logs tồn tại
    await db.query(`
      CREATE TABLE IF NOT EXISTS order_logs (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Bảng order_logs OK');

    // Đảm bảo bảng stock_history tồn tại
    await db.query(`
      CREATE TABLE IF NOT EXISTS stock_history (
        id SERIAL PRIMARY KEY,
        stock_id INT REFERENCES stock_in(id) ON DELETE CASCADE,
        old_item_name VARCHAR(150),
        old_quantity NUMERIC,
        old_unit_price NUMERIC,
        old_unit VARCHAR(50),
        old_buyer_name VARCHAR(100),
        old_supplier VARCHAR(150),
        old_stock_date TIMESTAMP,
        updated_by VARCHAR(100),
        change_date TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Bảng stock_history OK');

    console.log('\n=== BƯỚC 2: SEED DỮ LIỆU ĐƠN HÀNG MẪU ===');

    // Kiểm tra có đơn hàng chưa
    const { rows: existingOrders } = await db.query('SELECT COUNT(*) as count FROM orders');
    
    if (parseInt(existingOrders[0].count) > 0) {
      console.log(`ℹ️  Đã có ${existingOrders[0].count} đơn hàng trong DB. Bỏ qua seed.`);
    } else {
      // Lấy bàn và sản phẩm
      const { rows: tables } = await db.query('SELECT id FROM dining_tables ORDER BY id LIMIT 4');
      const { rows: products } = await db.query('SELECT id, price FROM products ORDER BY id LIMIT 4');

      if (tables.length === 0 || products.length === 0) {
        console.log('⚠️  Chưa có bàn hoặc sản phẩm để seed đơn. Hãy chạy seed-data.js trước.');
      } else {
        // Seed 6 đơn hàng với 6 trạng thái khác nhau
        const statuses = ['pending', 'confirmed', 'preparing', 'done', 'paid', 'cancelled'];
        const notes = [
          'Ít cay, không hành',
          'Thêm đá vào đồ uống',
          null,
          'Khách đặt trước',
          null,
          'Khách hủy vì chờ lâu'
        ];

        for (let i = 0; i < statuses.length; i++) {
          const table = tables[i % tables.length];
          const status = statuses[i];
          const note = notes[i];

          // Tạo đơn hàng
          await db.query('BEGIN');
          const { rows: orderRows } = await db.query(
            `INSERT INTO orders (table_id, order_status, note) VALUES ($1, $2, $3) RETURNING *`,
            [table.id, status, note]
          );
          const orderId = orderRows[0].id;

          // Thêm 1-2 món vào đơn
          const prod1 = products[i % products.length];
          const prod2 = products[(i + 1) % products.length];
          const qty1 = Math.floor(Math.random() * 2) + 1;
          const qty2 = Math.floor(Math.random() * 2) + 1;
          const total = (qty1 * Number(prod1.price)) + (qty2 * Number(prod2.price));

          await db.query(
            'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
            [orderId, prod1.id, qty1, prod1.price]
          );
          await db.query(
            'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
            [orderId, prod2.id, qty2, prod2.price]
          );

          // Cập nhật tổng tiền
          await db.query('UPDATE orders SET total_amount = $1 WHERE id = $2', [total, orderId]);

          // Ghi log trạng thái
          await db.query(
            'INSERT INTO order_logs (order_id, status) VALUES ($1, $2)',
            [orderId, status]
          );

          await db.query('COMMIT');
          console.log(`  ✅ Đơn #${orderId} - Bàn ${table.id} - Trạng thái: ${status.toUpperCase()} - Tổng: ${total.toLocaleString('vi-VN')}đ`);
        }

        console.log('\n🎉 Seed 6 đơn hàng mẫu THÀNH CÔNG!');
      }
    }

    console.log('\n=== MIGRATION HOÀN TẤT ✅ ===');
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    console.error('❌ LỖI MIGRATION:', err.message);
  } finally {
    process.exit(0);
  }
}

migrate();
