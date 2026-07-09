create extension if not exists "pgcrypto";

create table if not exists categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  category text not null references categories(id),
  title text not null,
  description text,
  materials text,
  dimensions text,
  price_cents integer not null check (price_cents >= 0),
  images jsonb not null default '[]',
  badge text,
  featured boolean not null default false,
  newest boolean not null default false,
  inventory integer not null default 0,
  availability text generated always as (
    case
      when inventory <= 0 then 'out_of_stock'
      when inventory <= 5 then 'low_stock'
      else 'in_stock'
    end
  ) stored,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  cart jsonb not null default '{"items":[]}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists wishlist (
  user_id uuid references auth.users(id) on delete cascade,
  product_id text references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stripe_session_id text not null unique,
  status text not null default 'pending',
  email text,
  total_cents integer not null default 0,
  currency text not null default 'usd',
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text not null references products(id),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create table if not exists webhook_events (
  event_id text primary key,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function decrement_inventory(product_id_input text, quantity_input integer)
returns void
language plpgsql
security definer
as $$
begin
  update products
  set inventory = greatest(inventory - quantity_input, 0),
      updated_at = now()
  where id = product_id_input;
end;
$$;

alter table categories enable row level security;
alter table products enable row level security;
alter table profiles enable row level security;
alter table wishlist enable row level security;
alter table newsletter_subscribers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table webhook_events enable row level security;

create policy "Public can read categories" on categories for select using (true);
create policy "Public can read active products" on products for select using (is_active = true);
create policy "Anyone can subscribe to newsletter" on newsletter_subscribers for insert with check (true);
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users manage own wishlist" on wishlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own orders" on orders for select using (auth.uid() = user_id);
create policy "Users read own order items" on order_items for select using (
  exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
