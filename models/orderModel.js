const db = require('../config/db');

class OrderModel {
  static async getAll() {
    const { rows } = await db.query(`
      SELECT 
        o.*,
        dt.table_name,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'product_name', p.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'image_url', p.image_url
          ))
          FROM order_items oi
          LEFT JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = o.id),
          '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN dining_tables dt ON dt.id = o.table_id
      ORDER BY o.created_at DESC
    `);
    return rows;
  }

  static async findById(id) {
    const { rows } = await db.query(`
      SELECT 
        o.*,
        dt.table_name,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'product_name', p.product_name,
            'image_url', p.image_url
          ))
          FROM order_items oi
          LEFT JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = o.id),
          '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN dining_tables dt ON dt.id = o.table_id
      WHERE o.id = $1
      GROUP BY o.id, dt.table_name
    `, [id]);
    
    return rows[0];
  }

  static async getOrdersByTable(tableId) {
    const { rows } = await db.query(`
      SELECT o.*, 
             (SELECT json_agg(json_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'product_name', p.product_name,
                'image_url', p.image_url
             )) 
              FROM order_items oi 
              LEFT JOIN products p ON p.id = oi.product_id
              WHERE oi.order_id = o.id) as items 
      FROM orders o 
      WHERE table_id = $1 
      ORDER BY created_at DESC`,
      [tableId]
    );
    return rows;
  }

  static async createOrder({ table_id, items, note, customer_name, customer_phone }) {
    try {
      await db.query('BEGIN');
      const { rows: orderRows } = await db.query(
        'INSERT INTO orders (table_id, note, customer_name, customer_phone) VALUES ($1, $2, $3, $4) RETURNING *',
        [table_id || null, note, customer_name, customer_phone]
      );
      const orderId = orderRows[0].id;
      let totalAmount = 0;

      for (const item of items) {
        const { product_id, quantity } = item;
        
        // 🛡️ BẢO MẬT: Lấy giá chính xác từ database, không tin tưởng giá từ client gửi lên
        const { rows: productRows } = await db.query(
          'SELECT price, discount_price FROM products WHERE id = $1',
          [product_id]
        );
        
        if (productRows.length === 0) continue;
        
        // Ưu tiên giá khuyến mãi nếu có
        const currentPrice = Number(productRows[0].discount_price || productRows[0].price);
        
        await db.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
          [orderId, product_id, quantity, currentPrice]
        );
        totalAmount += quantity * currentPrice;
      }

      await db.query('UPDATE orders SET total_amount = $1 WHERE id = $2', [totalAmount, orderId]);
      
      if (table_id) {
        await db.query('UPDATE dining_tables SET table_status = \'occupied\' WHERE id = $1', [table_id]);
      }
      
      await db.query('COMMIT');
      return { ...orderRows[0], total_amount: totalAmount };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  static async getOrdersByPhone(phone) {
    const { rows } = await db.query(`
      SELECT o.*, 
             (SELECT json_agg(json_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'product_name', p.product_name,
                'image_url', p.image_url
             )) 
              FROM order_items oi 
              LEFT JOIN products p ON p.id = oi.product_id
              WHERE oi.order_id = o.id) as items 
      FROM orders o 
      WHERE customer_phone = $1 
      ORDER BY created_at DESC`,
      [phone]
    );
    return rows;
  }

  static async updateStatus(id, status, paymentMethod = null, cancelReason = null) {
    try {
      await db.query('BEGIN');

      // Build SET clause dynamically
      const setClauses = ['order_status = $1'];
      const params = [status, id];
      let paramIdx = 3;

      if (paymentMethod) {
        setClauses.push(`payment_method = $${paramIdx}`);
        params.push(paymentMethod);
        paramIdx++;
      }
      if (cancelReason) {
        setClauses.push(`cancel_reason = $${paramIdx}`);
        params.push(cancelReason);
        paramIdx++;
      }

      const queryStr = `UPDATE orders SET ${setClauses.join(', ')} WHERE id = $2 RETURNING *`;
      const { rows } = await db.query(queryStr, params);

      await db.query('INSERT INTO order_logs (order_id, status) VALUES ($1, $2)', [id, status]);
      if (status === 'done' || status === 'cancelled') {
        const { rows: tableRows } = await db.query('SELECT table_id FROM orders WHERE id = $1', [id]);
        if (tableRows.length > 0 && tableRows[0].table_id) {
          await db.query('UPDATE dining_tables SET table_status = \'empty\' WHERE id = $1', [tableRows[0].table_id]);
        }
      }
      await db.query('COMMIT');
      return rows[0];
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  static async delete(id) {
    await db.query('DELETE FROM orders WHERE id = $1', [id]);
    return true;
  }
}

module.exports = OrderModel;
