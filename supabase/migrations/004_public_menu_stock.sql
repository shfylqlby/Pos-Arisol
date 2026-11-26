-- Migration 004: stok menu publik
-- Menghubungkan menu publik ke produk POS dan menyediakan stok agregat
-- yang boleh dibaca publik tanpa membuka tabel stok mentah.

alter table public.public_menu_items
  add column if not exists product_id text references public.products(id) on delete set null;

create index if not exists public_menu_items_product_idx
  on public.public_menu_items (product_id);

create or replace view public.public_menu_with_stock as
select
  mi.id,
  mi.name,
  mi.category,
  mi.price,
  mi.image_url,
  mi.sort_order,
  mi.active,
  mi.product_id,
  case
    when mi.product_id is null then null
    else coalesce(sum(sm.qty), 0)::int
  end as stock_qty
from public.public_menu_items mi
left join public.stock_movements sm on sm.product_id = mi.product_id
group by
  mi.id,
  mi.name,
  mi.category,
  mi.price,
  mi.image_url,
  mi.sort_order,
  mi.active,
  mi.product_id;

grant select on public.public_menu_with_stock to anon, authenticated;
