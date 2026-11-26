-- Migration 003: menu publik + foto menu
-- Jalankan setelah 001 dan 002. Tabel ini dibaca publik (halaman Arisol)
-- dan hanya bisa diubah oleh pengguna yang login.

create table if not exists public.public_menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price integer not null check (price >= 0),
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists public_menu_items_active_idx
  on public.public_menu_items (active, sort_order, name);

alter table public.public_menu_items enable row level security;

drop policy if exists "public menu read" on public.public_menu_items;
create policy "public menu read" on public.public_menu_items
  for select using (true);

drop policy if exists "authenticated menu insert" on public.public_menu_items;
create policy "authenticated menu insert" on public.public_menu_items
  for insert to authenticated with check (true);

drop policy if exists "authenticated menu update" on public.public_menu_items;
create policy "authenticated menu update" on public.public_menu_items
  for update to authenticated using (true) with check (true);

drop policy if exists "authenticated menu delete" on public.public_menu_items;
create policy "authenticated menu delete" on public.public_menu_items
  for delete to authenticated using (true);

grant select on public.public_menu_items to anon, authenticated;
grant insert, update, delete on public.public_menu_items to authenticated;

-- Isi menu awal hanya jika tabel masih kosong.
insert into public.public_menu_items (name, category, price, sort_order)
select * from (values
  ('Risol Mayo Sosis Telur', 'Risol Mayo', 3000, 1),
  ('Risol Mayo Smoked Beef', 'Risol Mayo', 3500, 2),
  ('Risol Mayo Crab Stick Keju', 'Risol Mayo', 3500, 3),
  ('Risol Mayo Crab Stick Telur', 'Risol Mayo', 3500, 4),
  ('Risoles Chicken Mushroom Bolognese', 'Risoles Ayam / Pedas', 4000, 5),
  ('Risoles Ayam Suwir Pedas', 'Risoles Ayam / Pedas', 3500, 6),
  ('Risoles Ragout Ayam Sayur', 'Risoles Ayam / Pedas', 3500, 7),
  ('Risoles Banana Choco Crunchy', 'Risoles Manis', 4000, 8),
  ('Risoles Choco Crunchy Cheese', 'Risoles Manis', 4000, 9),
  ('Risoles Matcha', 'Risoles Manis', 4000, 10),
  ('Risoles Tiramisu Oreo', 'Risoles Manis', 3500, 11),
  ('Kebab Medium', 'Kebab', 7500, 12)
) as seed(name, category, price, sort_order)
where not exists (select 1 from public.public_menu_items);

-- Bucket foto menu (public read, authenticated write).
insert into storage.buckets (id, name, public)
values ('menu', 'menu', true)
on conflict (id) do update set public = true;

drop policy if exists "menu photos public read" on storage.objects;
create policy "menu photos public read" on storage.objects
  for select using (bucket_id = 'menu');

drop policy if exists "menu photos authenticated insert" on storage.objects;
create policy "menu photos authenticated insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'menu');

drop policy if exists "menu photos authenticated update" on storage.objects;
create policy "menu photos authenticated update" on storage.objects
  for update to authenticated using (bucket_id = 'menu') with check (bucket_id = 'menu');

drop policy if exists "menu photos authenticated delete" on storage.objects;
create policy "menu photos authenticated delete" on storage.objects
  for delete to authenticated using (bucket_id = 'menu');
