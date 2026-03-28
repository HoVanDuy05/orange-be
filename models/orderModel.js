const db = require('../config/db');

// Valid order statuses
const VALID_ORDER_TYPES = ['dine_in', 'take_away', 'delivery'];
const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'delivering', 'served', 'completed', 'cancelled'];

class OrderModel {
  /**
   * Build the base SELECT query with joins for orders.
   * Re-used across getAll / findById / getByTable / getByPhone
   */
  static #baseSelect() {
    return `
      SELECT 
        o.*,
        'ORANGE-' || to_char(o.created_at, 'YYYYMMDD') || '-' || lpad(o.id::text, 4, '0') AS order_code,
        dt.table_name,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id',           oi.id,
            'product_id',   oi.product_id,
            'product_name', p.product_name,
            'image_url',    p.image_url,
            'quantity',     oi.quantity,
            'unit_price',   oi.unit_price,
            'is_completed', oi.is_completed
          ) ORDER BY oi.id)
          FROM order_items oi
          LEFT JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = o.id),
          '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN dining_tables dt ON dt.id = o.table_id
    `;
  }

  static async getAll({ status, type, date, page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    
    let baseSql = `
      FROM orders o
      LEFT JOIN dining_tables dt ON dt.id = o.table_id
      WHERE 1=1
    `;
    const params = [];
    const where = [];
    let idx = 1;

    if (status) {
      where.push(`o.order_status = $${idx++}`);
      params.push(status);
    }
    if (type) {
      where.push(`o.order_type = $${idx++}`);
      params.push(type);
    }
    if (date) {
      where.push(`DATE(o.created_at) = $${idx++}`);
      params.push(date);
    }

    if (where.length > 0) baseSql += ` AND ${where.join(' AND ')}`;

    // Count total
    const countSql = `SELECT COUNT(*) as total ${baseSql}`;
    const countRes = await db.query(countSql, params);
    const total = parseInt(countRes.rows[0].total);

    // Get data
    let dataSql = `
      SELECT 
        o.*,
        'ORANGE-' || to_char(o.created_at, 'YYYYMMDD') || '-' || lpad(o.id::text, 4, '0') AS order_code,
        dt.table_name,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id',           oi.id,
            'product_id',   oi.product_id,
            'product_name', p.product_name,
            'image_url',    p.image_url,
            'quantity',     oi.quantity,
            'unit_price',   oi.unit_price,
            'is_completed', oi.is_completed
          ) ORDER BY oi.id)
          FROM order_items oi
          LEFT JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = o.id),
          '[]'::json
        ) AS items
      ${baseSql}
      ORDER BY o.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    
    params.push(limit, offset);
    const { rows } = await db.query(dataSql, params);
    
    return {
      orders: rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async findById(id) {
    const sql = OrderModel.#baseSelect() + ' WHERE o.id = $1 GROUP BY o.id, dt.table_name';
    const { rows } = await db.query(sql, [id]);
    return rows[0] || null;
  }

  static async getByTable(tableId) {
    const sql = OrderModel.#baseSelect() +
      ` WHERE o.table_id = $1 AND o.order_status NOT IN ('completed', 'cancelled')
        ORDER BY o.created_at DESC`;
    const { rows } = await db.query(sql, [tableId]);
    return rows;
  }

  static async getByPhone(phone) {
    const sql = OrderModel.#baseSelect() +
      ' WHERE o.customer_phone = $1 ORDER BY o.created_at DESC';
    const { rows } = await db.query(sql, [phone]);
    return rows;
  }

  /**
   * Create a new order (online or offline).
   * Validates order_type, computes total from DB prices (never trust client price).
   */
  static async create({
    order_type = 'dine_in',
    table_id,
    customer_name,
    customer_phone,
    shipping_address,
    note,
    payment_method,
    items = []
  }) {
    if (!VALID_ORDER_TYPES.includes(order_type)) {
      throw new Error(`order_type không hợp lệ: ${order_type}`);
    }
    if (order_type === 'delivery' && !shipping_address) {
      throw new Error('Đơn giao hàng cần có địa chỉ giao hàng (shipping_address)');
    }
    if (items.length === 0) {
      throw new Error('Đơn hàng phải có ít nhất 1 sản phẩm');
    }

    try {
      await db.query('BEGIN');

      const { rows: orderRows } = await db.query(
        `INSERT INTO orders
          (order_type, table_id, customer_name, customer_phone, shipping_address, note, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          order_type,
          order_type === 'dine_in' ? (table_id || null) : null,
          customer_name || null,
          customer_phone || null,
          shipping_address || null,
          note || null,
          payment_method || null
        ]
      );
      const order = orderRows[0];
      const orderId = order.id;
      let totalAmount = 0;

      for (const item of items) {
        const { product_id, quantity } = item;
        if (!product_id || !quantity || quantity < 1) continue;

        // 🔒 Always fetch price from DB — never trust client-sent price
        const { rows: productRows } = await db.query(
          'SELECT price FROM products WHERE id = $1 AND is_active = true',
          [product_id]
        );
        if (productRows.length === 0) continue;

        const unitPrice = Number(productRows[0].price);
        await db.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
          [orderId, product_id, quantity, unitPrice]
        );
        totalAmount += quantity * unitPrice;
      }

      await db.query('UPDATE orders SET total_amount = $1 WHERE id = $2', [totalAmount, orderId]);
      await db.query(
        'INSERT INTO order_logs (order_id, status, note) VALUES ($1, $2, $3)',
        [orderId, 'pending', 'Đơn hàng mới được tạo']
      );

      await db.query('COMMIT');
      return { ...order, total_amount: totalAmount };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Update order status. Enforces valid transitions and handles payment fields.
   */
  static async updateStatus(id, status, paymentMethod = null, cancelReason = null) {
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Trạng thái không hợp lệ: ${status}`);
    }

    try {
      await db.query('BEGIN');

      const setClauses = ['order_status = $1'];
      const params = [status, id];
      let idx = 3;

      // Auto-set paid_at on completed or when payment method is provided
      if (status === 'completed') {
        setClauses.push(`paid_at = COALESCE(paid_at, NOW())`);
        setClauses.push(`payment_status = 'success'`);
      }
      if (paymentMethod) {
        setClauses.push(`payment_method = $${idx++}`);
        params.push(paymentMethod);
      }
      if (cancelReason) {
        setClauses.push(`cancel_reason = $${idx++}`);
        params.push(cancelReason);
      }

      const { rows } = await db.query(
        `UPDATE orders SET ${setClauses.join(', ')} WHERE id = $2 RETURNING *`,
        params
      );
      if (rows.length === 0) throw new Error('Không tìm thấy đơn hàng');

      await db.query(
        'INSERT INTO order_logs (order_id, status, note) VALUES ($1, $2, $3)',
        [id, status, cancelReason || null]
      );

      await db.query('COMMIT');
      return rows[0];
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  /** Update individual item completion (pha chế xong 1 ly) */
  static async updateItemStatus(orderId, itemId, is_completed) {
    const { rows } = await db.query(
      'UPDATE order_items SET is_completed = $1 WHERE id = $2 AND order_id = $3 RETURNING *',
      [is_completed, itemId, orderId]
    );
    return rows[0] || null;
  }

  static async delete(id) {
    await db.query('DELETE FROM orders WHERE id = $1', [id]);
    return true;
  }
}

module.exports = OrderModel;
