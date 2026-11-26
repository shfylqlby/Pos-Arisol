-- Migration 002: settings.qris_image + LWW guard
-- Jalankan setelah 001_initial_schema.sql.

-- 1. Kolom QRIS yang sebelumnya hanya ada di Dexie lokal.
alter table public.settings add column if not exists qris_image text;

-- 2. Guard LWW: update dengan updated_at lebih lama dari versi server diabaikan.
--    Dipakai pada tabel mutable yang punya kolom updated_at.
create or replace function public.guard_lww() returns trigger as $$
begin
  if new.updated_at < old.updated_at then
    return old;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists settings_lww on public.settings;
create trigger settings_lww before update on public.settings
  for each row execute function public.guard_lww();

drop trigger if exists products_lww on public.products;
create trigger products_lww before update on public.products
  for each row execute function public.guard_lww();

drop trigger if exists preorders_lww on public.preorders;
create trigger preorders_lww before update on public.preorders
  for each row execute function public.guard_lww();

drop trigger if exists partners_lww on public.partners;
create trigger partners_lww before update on public.partners
  for each row execute function public.guard_lww();

drop trigger if exists consignment_settlements_lww on public.consignment_settlements;
create trigger consignment_settlements_lww before update on public.consignment_settlements
  for each row execute function public.guard_lww();
