-- =============================
-- ENUM (trạng thái chuẩn)
-- =============================

create type table_status_enum as enum ('empty', 'occupied');

create type order_status_enum as enum (
  'pending', 'confirmed', 'preparing', 'done', 'paid', 'cancelled'
);

create type item_status_enum as enum (
  'pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'
);

create type payment_status_enum as enum (
  'pending', 'success', 'failed'
);

-- =============================
-- 🪑 BÀN
-- =============================

create table dining_tables (
  id serial primary key,
  table_name varchar(50) not null,
  table_status table_status_enum default 'empty',
  created_at timestamp default now()
);

-- =============================
-- 📂 DANH MỤC
-- =============================

create table categories (
  id serial primary key,
  category_name varchar(100) not null,
  description text,
  is_active boolean default true
);

-- =============================
-- 🍔 SẢN PHẨM
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
-- 🧾 ĐƠN HÀNG
-- =============================

create table orders (
  id serial primary key,
  table_id int references dining_tables(id),
  order_status order_status_enum default 'pending',
  total_amount decimal(10,2) default 0,
  note text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- =============================
-- 📦 CHI TIẾT ĐƠN (QUAN TRỌNG NHẤT)
-- =============================

create table order_items (
  id serial primary key,
  order_id int references orders(id) on delete cascade,
  product_id int references products(id),
  quantity int not null,
  unit_price decimal(10,2) not null,
  item_status item_status_enum default 'pending',

  -- thời gian xử lý
  started_at timestamp,
  completed_at timestamp
);

-- =============================
-- 👤 USERS
-- =============================

create table users (
  id serial primary key,
  full_name varchar(100),
  email varchar(150) unique,
  password_hash text,
  role varchar(20) default 'staff',
  created_at timestamp default now()
);

-- =============================
-- 💳 PAYMENTS
-- =============================

create table payments (
  id serial primary key,
  order_id int references orders(id),
  payment_method varchar(50),
  amount decimal(10,2),
  payment_status payment_status_enum default 'pending',
  paid_at timestamp
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
-- 📜 LOG TRẠNG THÁI ĐƠN
-- =============================

create table order_logs (
  id serial primary key,
  order_id int references orders(id) on delete cascade,
  status order_status_enum,
  created_at timestamp default now()
);

-- =============================
-- INDEX (tối ưu performance 🔥)
-- =============================

create index idx_orders_table_id on orders(table_id);
create index idx_orders_status on orders(order_status);

create index idx_order_items_order_id on order_items(order_id);
create index idx_order_items_status on order_items(item_status);

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
