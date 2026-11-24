-- Migration 001: Initial schema for POS Risol
-- RLS enabled on all tables, owner_id = auth.uid()

create or replace function public.touch_server_updated_at() returns trigger as $$
begin
  new.server_updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. settings
create table if not exists public.settings (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  device_id text default 'default',
  business_name text not null,
  address text default '',
  phone text default '',
  receipt_footer text default 'Terima kasih atas kunjungannya!',
  timezone text default 'Asia/Jakarta',
  low_stock_threshold_default int default 10,
  device_label text default 'A',
  auto_return_seconds int default 8,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
create policy "own settings read" on public.settings for select using (owner_id = auth.uid());
create policy "own settings insert" on public.settings for insert with check (owner_id = auth.uid());
create policy "own settings update" on public.settings for update using (owner_id = auth.uid());
create trigger settings_touch before insert or update on public.settings
  for each row execute function public.touch_server_updated_at();

-- 2. products
create table if not exists public.products (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  device_id text default 'default',
  name text not null,
  category text default 'Risol',
  kind text not null check (kind in ('single', 'bundle')),
  base_product_id text,
  unit_qty int not null default 1 check (unit_qty >= 1),
  price int not null check (price >= 0),
  cost_price int not null default 0 check (cost_price >= 0),
  track_stock boolean not null default true,
  low_stock_threshold int,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now()
);
create index if not exists idx_products_pull on public.products (owner_id, server_updated_at);
alter table public.products enable row level security;
create policy "own products read" on public.products for select using (owner_id = auth.uid());
create policy "own products insert" on public.products for insert with check (owner_id = auth.uid());
create policy "own products update" on public.products for update using (owner_id = auth.uid());
create trigger products_touch before insert or update on public.products
  for each row execute function public.touch_server_updated_at();

-- 3. sales (append-only)
create table if not exists public.sales (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  device_id text default 'default',
  receipt_no text not null,
  business_date date not null,
  subtotal int not null check (subtotal >= 0),
  discount int not null default 0 check (discount >= 0),
  total int not null check (total >= 0),
  deposit_applied int not null default 0 check (deposit_applied >= 0),
  payment_method text not null check (payment_method in ('cash', 'qris', 'transfer')),
  paid_amount int not null check (paid_amount >= 0),
  change_amount int not null check (change_amount >= 0),
  source text not null default 'pos' check (source in ('pos', 'preorder')),
  preorder_id text,
  note text,
  created_at timestamptz not null,
  server_updated_at timestamptz not null default now()
);
create index if not exists idx_sales_pull on public.sales (owner_id, server_updated_at);
alter table public.sales enable row level security;
create policy "own sales read" on public.sales for select using (owner_id = auth.uid());
create policy "own sales insert" on public.sales for insert with check (owner_id = auth.uid());
create trigger sales_touch before insert or update on public.sales
  for each row execute function public.touch_server_updated_at();

-- 4. sale_items (append-only)
create table if not exists public.sale_items (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  sale_id text not null references public.sales(id),
  product_id text not null,
  product_name text not null,
  qty int not null check (qty >= 1),
  unit_price int not null check (unit_price >= 0),
  unit_cost int not null check (unit_cost >= 0),
  stock_product_id text not null,
  stock_qty int not null check (stock_qty >= 1),
  server_updated_at timestamptz not null default now()
);
create index if not exists idx_sale_items_pull on public.sale_items (owner_id, server_updated_at);
alter table public.sale_items enable row level security;
create policy "own sale_items read" on public.sale_items for select using (owner_id = auth.uid());
create policy "own sale_items insert" on public.sale_items for insert with check (owner_id = auth.uid());
create trigger sale_items_touch before insert or update on public.sale_items
  for each row execute function public.touch_server_updated_at();

-- 5. sale_voids (append-only)
create table if not exists public.sale_voids (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  sale_id text not null unique references public.sales(id),
  reason text not null check (reason in ('salah_input', 'batal_pembeli', 'lainnya')),
  note text,
  created_at timestamptz not null,
  server_updated_at timestamptz not null default now()
);
create index if not exists idx_sale_voids_pull on public.sale_voids (owner_id, server_updated_at);
alter table public.sale_voids enable row level security;
create policy "own sale_voids read" on public.sale_voids for select using (owner_id = auth.uid());
create policy "own sale_voids insert" on public.sale_voids for insert with check (owner_id = auth.uid());
create trigger sale_voids_touch before insert or update on public.sale_voids
  for each row execute function public.touch_server_updated_at();

-- 6. stock_movements (append-only)
create table if not exists public.stock_movements (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  product_id text not null,
  type text not null check (type in ('production', 'sale', 'sale_void', 'waste', 'adjustment', 'consignment_out', 'consignment_return')),
  qty int not null,
  unit_cost int not null default 0,
  business_date date not null,
  ref_type text,
  ref_id text,
  reason text,
  note text,
  created_at timestamptz not null,
  server_updated_at timestamptz not null default now()
);
create index if not exists idx_stock_movements_pull on public.stock_movements (owner_id, server_updated_at);
alter table public.stock_movements enable row level security;
create policy "own stock_movements read" on public.stock_movements for select using (owner_id = auth.uid());
create policy "own stock_movements insert" on public.stock_movements for insert with check (owner_id = auth.uid());
create trigger stock_movements_touch before insert or update on public.stock_movements
  for each row execute function public.touch_server_updated_at();

-- 7. preorders
create table if not exists public.preorders (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  device_id text default 'default',
  customer_name text not null,
  phone text default '',
  pickup_at timestamptz not null,
  status text not null default 'new' check (status in ('new', 'in_production', 'ready', 'done', 'cancelled')),
  deposit int not null default 0 check (deposit >= 0),
  total int not null default 0 check (total >= 0),
  note text,
  sale_id text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now()
);
create index if not exists idx_preorders_pull on public.preorders (owner_id, server_updated_at);
alter table public.preorders enable row level security;
create policy "own preorders read" on public.preorders for select using (owner_id = auth.uid());
create policy "own preorders insert" on public.preorders for insert with check (owner_id = auth.uid());
create policy "own preorders update" on public.preorders for update using (owner_id = auth.uid());
create trigger preorders_touch before insert or update on public.preorders
  for each row execute function public.touch_server_updated_at();

-- 8. preorder_items
create table if not exists public.preorder_items (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  preorder_id text not null references public.preorders(id),
  product_id text not null,
  product_name text not null,
  qty int not null check (qty >= 1),
  unit_price int not null check (unit_price >= 0),
  server_updated_at timestamptz not null default now()
);
create index if not exists idx_preorder_items_pull on public.preorder_items (owner_id, server_updated_at);
alter table public.preorder_items enable row level security;
create policy "own preorder_items read" on public.preorder_items for select using (owner_id = auth.uid());
create policy "own preorder_items insert" on public.preorder_items for insert with check (owner_id = auth.uid());
create trigger preorder_items_touch before insert or update on public.preorder_items
  for each row execute function public.touch_server_updated_at();

-- 9. partners
create table if not exists public.partners (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  device_id text default 'default',
  name text not null,
  contact text default '',
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now()
);
create index if not exists idx_partners_pull on public.partners (owner_id, server_updated_at);
alter table public.partners enable row level security;
create policy "own partners read" on public.partners for select using (owner_id = auth.uid());
create policy "own partners insert" on public.partners for insert with check (owner_id = auth.uid());
create policy "own partners update" on public.partners for update using (owner_id = auth.uid());
create trigger partners_touch before insert or update on public.partners
  for each row execute function public.touch_server_updated_at();

-- 10. partner_prices
create table if not exists public.partner_prices (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  partner_id text not null references public.partners(id),
  product_id text not null,
  price int not null check (price >= 0),
  server_updated_at timestamptz not null default now(),
  unique(partner_id, product_id)
);
create index if not exists idx_partner_prices_pull on public.partner_prices (owner_id, server_updated_at);
alter table public.partner_prices enable row level security;
create policy "own partner_prices read" on public.partner_prices for select using (owner_id = auth.uid());
create policy "own partner_prices insert" on public.partner_prices for insert with check (owner_id = auth.uid());
create policy "own partner_prices update" on public.partner_prices for update using (owner_id = auth.uid());
create trigger partner_prices_touch before insert or update on public.partner_prices
  for each row execute function public.touch_server_updated_at();

-- 11. consignment_drops
create table if not exists public.consignment_drops (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  partner_id text not null references public.partners(id),
  drop_date date not null,
  note text,
  created_at timestamptz not null,
  server_updated_at timestamptz not null default now()
);
create index if not exists idx_consignment_drops_pull on public.consignment_drops (owner_id, server_updated_at);
alter table public.consignment_drops enable row level security;
create policy "own consignment_drops read" on public.consignment_drops for select using (owner_id = auth.uid());
create policy "own consignment_drops insert" on public.consignment_drops for insert with check (owner_id = auth.uid());
create trigger consignment_drops_touch before insert or update on public.consignment_drops
  for each row execute function public.touch_server_updated_at();

-- 12. consignment_drop_items
create table if not exists public.consignment_drop_items (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  drop_id text not null references public.consignment_drops(id),
  product_id text not null,
  qty int not null check (qty >= 1),
  server_updated_at timestamptz not null default now()
);
create index if not exists idx_consignment_drop_items_pull on public.consignment_drop_items (owner_id, server_updated_at);
alter table public.consignment_drop_items enable row level security;
create policy "own consignment_drop_items read" on public.consignment_drop_items for select using (owner_id = auth.uid());
create policy "own consignment_drop_items insert" on public.consignment_drop_items for insert with check (owner_id = auth.uid());
create trigger consignment_drop_items_touch before insert or update on public.consignment_drop_items
  for each row execute function public.touch_server_updated_at();

-- 13. consignment_settlements
create table if not exists public.consignment_settlements (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  partner_id text not null references public.partners(id),
  period_start date not null,
  period_end date not null,
  total_due int not null check (total_due >= 0),
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  paid_at timestamptz,
  note text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  server_updated_at timestamptz not null default now()
);
create index if not exists idx_consignment_settlements_pull on public.consignment_settlements (owner_id, server_updated_at);
alter table public.consignment_settlements enable row level security;
create policy "own consignment_settlements read" on public.consignment_settlements for select using (owner_id = auth.uid());
create policy "own consignment_settlements insert" on public.consignment_settlements for insert with check (owner_id = auth.uid());
create policy "own consignment_settlements update" on public.consignment_settlements for update using (owner_id = auth.uid());
create trigger consignment_settlements_touch before insert or update on public.consignment_settlements
  for each row execute function public.touch_server_updated_at();

-- 14. consignment_settlement_items
create table if not exists public.consignment_settlement_items (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  settlement_id text not null references public.consignment_settlements(id),
  product_id text not null,
  sold_qty int not null check (sold_qty >= 0),
  returned_qty int not null check (returned_qty >= 0),
  unit_price int not null check (unit_price >= 0),
  unit_cost int not null check (unit_cost >= 0),
  amount int not null check (amount >= 0),
  server_updated_at timestamptz not null default now()
);
create index if not exists idx_consignment_settlement_items_pull on public.consignment_settlement_items (owner_id, server_updated_at);
alter table public.consignment_settlement_items enable row level security;
create policy "own consignment_settlement_items read" on public.consignment_settlement_items for select using (owner_id = auth.uid());
create policy "own consignment_settlement_items insert" on public.consignment_settlement_items for insert with check (owner_id = auth.uid());
create trigger consignment_settlement_items_touch before insert or update on public.consignment_settlement_items
  for each row execute function public.touch_server_updated_at();
