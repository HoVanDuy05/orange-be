-- =============================
-- ENUM (Trạng thái dành cho Quán Nước / Cafe: Offline & Online)
-- =============================

create type order_type_enum as enum (
  'dine_in',     -- Ăn uống tại bàn (Offline)
  'take_away',   -- Khách mua mang đi (Offline / Đặt trước lấy tại quầy)
  'delivery'     -- Giao hàng tận nơi (Online)
);

create type order_status_enum as enum (
  'pending',       -- Chờ xác nhận
  'confirmed',     -- Đã xác nhận / Đã thanh toán
  'preparing',     -- Đang pha chế
  'delivering',    -- Đang giao hàng (Dành riêng cho Đơn Online)
  'served',        -- Đã mang ra bàn / Khách đã nhận thức uống
  'completed',     -- Đã hoàn thành toàn bộ (Đóng bill)
  'cancelled'      -- Đã hủy
);

create type payment_status_enum as enum (
  'pending', 
  'success', 
  'failed',
  'refunded'
);

-- =============================
-- 🪑 BÀN (Dining Tables - Dành cho Offline Dine-In)
-- =============================

create table dining_tables (
  id serial primary key,
  table_name varchar(50) not null,
  is_active boolean default true,
  created_at timestamp default now()
);

-- =============================
-- 📂 DANH MỤC ĐỒ UỐNG / SẢN PHẨM
-- =============================

create table categories (
  id serial primary key,
  category_name varchar(100) not null,
  description text,
  is_active boolean default true
);

-- =============================
-- 🍹 ĐỒ UỐNG (PRODUCTS)
-- =============================

create table products (
  id serial primary key,
  product_name varchar(150) not null,
  description text,
  price decimal(10,2) not null,
  image_url text,
  category_id int references categories(id),
  is_active boolean default true,
  created_at timestamp default now()
);

-- =============================
-- 👤 USERS (Nhân viên, Quản trị, hoặc Khách online)
-- =============================

create table users (
  id serial primary key,
  full_name varchar(100),
  email varchar(150) unique,
  password_hash text,
  role varchar(20) default 'staff', -- admin, staff, customer
  created_at timestamp default now()
);

-- =============================
-- 🧾 ĐƠN HÀNG (Bao quát cả Online và Offline)
-- =============================

create table orders (
  id serial primary key,
  
  -- Phân loại Cấu trúc đơn (Online hay Offline)
  order_type order_type_enum default 'dine_in',
  
  -- Thông tin Khách hàng
  customer_name varchar(150),
  customer_phone varchar(20),
  customer_id int references users(id) on delete set null,
  
  -- Vị trí ngồi (Chỉ dùng cho dine_in)
  table_id int references dining_tables(id) on delete set null,
  
  -- Địa chỉ giao hàng (Chỉ dùng cho delivery / Online)
  shipping_address text,
  
  -- Trạng thái đơn & Thanh toán
  order_status order_status_enum default 'pending',
  total_amount decimal(10,2) default 0,
  payment_method varchar(50), 
  payment_status payment_status_enum default 'pending',
  paid_at timestamp,
  
  -- Ghi chú & Lý do hủy
  note text,
  cancel_reason text,

  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- =============================
-- 📦 CHI TIẾT ĐƠN (Các món đồ uống của khách)
-- =============================

create table order_items (
  id serial primary key,
  order_id int references orders(id) on delete cascade,
  product_id int references products(id),
  
  quantity int not null default 1,
  unit_price decimal(10,2) not null,
  
  -- Trạng thái pha chế từng ly/món
  is_completed boolean default false
);

-- =============================
-- 🖼️ BANNERS
-- =============================

create table banners (
  id serial primary key,
  title varchar(150),
  image_url text,
  redirect_url text,
  is_active boolean default true
);

-- =============================
-- ⚙️ SETTINGS
-- =============================

create table settings (
  id serial primary key,
  setting_key varchar(100),
  setting_value text
);

-- =============================
-- 🔔 PUSH NOTIFICATIONS
-- =============================

create table push_subscriptions (
  id serial primary key,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp default now()
);

-- =============================
-- 📜 LOG TRẠNG THÁI ĐƠN
-- =============================

create table order_logs (
  id serial primary key,
  order_id int references orders(id) on delete cascade,
  status order_status_enum,
  note text,
  created_at timestamp default now()
);

-- =============================
-- INDEX (Tối ưu performance 🔥)
-- =============================

create index idx_orders_table_id on orders(table_id);
create index idx_orders_customer_phone on orders(customer_phone);
create index idx_orders_type on orders(order_type);
create index idx_orders_status on orders(order_status);

create index idx_order_items_order_id on order_items(order_id);
create index idx_products_category on products(category_id);

-- =============================
-- AUTO UPDATE updated_at
-- =============================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_orders_updated_at
before update on orders
for each row
execute function update_updated_at_column();
