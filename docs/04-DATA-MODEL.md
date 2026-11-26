# 04. Model Data

Satuan stok selalu **pcs**. Uang selalu **integer rupiah**. Waktu **ISO 8601 UTC**. ID **ULID** dibuat di klien.

## 1. Kolom umum

Semua tabel yang disinkron punya:

| Kolom               | Tipe               | Keterangan                                          |
| ------------------- | ------------------ | --------------------------------------------------- |
| `id`                | string (ULID)      | PK, dibuat klien                                    |
| `owner_id`          | uuid               | Diisi saat login (null sebelum login di sisi lokal) |
| `created_at`        | ISO string         | Waktu klien                                         |
| `updated_at`        | ISO string         | Hanya tabel mutable                                 |
| `deleted_at`        | ISO string \| null | Soft delete, hanya tabel master/dokumen             |
| `device_id`         | string             | Perangkat pembuat                                   |
| `server_updated_at` | timestamptz        | **Hanya di Postgres**, diisi trigger; kursor pull   |

## 2. Tabel

### settings (1 baris per pemilik)

`id`, `business_name`, `address`, `phone`, `receipt_footer`, `timezone` (default `Asia/Jakarta`), `low_stock_threshold_default` (10), `device_label` ("A"), `pin_hash` (lokal saja, tidak di-sync), `auto_return_seconds` (8), `qris_image` (Blob lokal), `updated_at`.

### products

| Kolom                      | Tipe                   | Keterangan                                                        |
| -------------------------- | ---------------------- | ----------------------------------------------------------------- |
| `name`                     | string                 | "Risol Mayo", "Paket Isi 5"                                       |
| `category`                 | string                 | "Risol", "Paket", "Minuman"                                       |
| `kind`                     | `'single' \| 'bundle'` |                                                                   |
| `base_product_id`          | id \| null             | Wajib jika `bundle`; menunjuk produk single yang stoknya dipotong |
| `unit_qty`                 | int ≥ 1                | Jumlah pcs yang dipotong per 1 unit jual (single = 1)             |
| `price`                    | int                    | Harga jual per unit jual                                          |
| `cost_price`               | int                    | Modal per unit jual (bundle: modal per paket)                     |
| `track_stock`              | bool                   | Single: true. Bundle: selalu false (stok dari base)               |
| `low_stock_threshold`      | int \| null            | Null = pakai default                                              |
| `sort_order`               | int                    |                                                                   |
| `is_active`                | bool                   |                                                                   |
| `photo`                    | Blob \| null           | Lokal                                                             |
| `updated_at`, `deleted_at` |                        |                                                                   |

### sales (append-only)

`id`, `receipt_no` (`A-0012`), `business_date` (`YYYY-MM-DD` di zona waktu usaha), `created_at`, `subtotal`, `discount`, `total` (= subtotal − discount, ≥ 0; nilai penuh transaksi), `deposit_applied` (int, default 0; DP pre-order yang sudah dibayar sebelumnya), `payment_method` (`cash|qris|transfer`), `paid_amount` (uang diterima **saat ini**), `change_amount`, `source` (`pos|preorder`), `preorder_id` | null, `note`.
Jumlah yang harus dibayar saat ini = `total − deposit_applied`.

### sale_items (append-only)

`id`, `sale_id`, `product_id`, `product_name` (snapshot), `qty` (unit jual), `unit_price` (snapshot), `unit_cost` (snapshot), `stock_product_id`, `stock_qty` (= `qty × unit_qty`, pcs).

### sale_voids (append-only)

`id`, `sale_id` (unik; satu void per sale), `reason` (`salah_input|batal_pembeli|lainnya`), `note`, `created_at`.
Sebuah sale dianggap **void** jika ada baris `sale_voids` untuknya. Void menulis `stock_movements` bertipe `sale_void` (qty positif, kebalikan dari movement `sale`).

### stock_movements (append-only, ledger)

| Kolom                | Keterangan                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `product_id`         | Selalu produk single (`track_stock = true`)                                                                                        |
| `type`               | `production`, `sale`, `sale_void`, `waste`, `adjustment`, `consignment_out`, `consignment_return`                                  |
| `qty`                | **Bertanda, pcs.** `production` +, `sale` −, `sale_void` +, `waste` −, `consignment_out` −, `consignment_return` +, `adjustment` ± |
| `unit_cost`          | Snapshot modal per pcs (untuk nilai waste dan HPP)                                                                                 |
| `business_date`      |                                                                                                                                    |
| `ref_type`, `ref_id` | Contoh `sale`/`<sale_id>`, `consignment_drop`/`<id>`, `closing`/`<id>`                                                             |
| `reason`, `note`     | Untuk waste/adjustment                                                                                                             |

**Stok saat ini** = `SUM(qty)` per `product_id`. Tidak ada kolom stok yang diedit.
**Tutup hari:** untuk tiap produk, `selisih = sisa_fisik − stok_sistem`. Jika `selisih < 0` → movement `waste`; jika `> 0` → movement `adjustment`. Tidak menghapus movement lama.

### preorders (mutable)

`id`, `customer_name`, `phone`, `pickup_at`, `status` (`new|in_production|ready|done|cancelled`), `deposit` (int), `total` (int, dihitung dari items), `note`, `sale_id` | null (terisi saat `done`), `updated_at`, `deleted_at`.

### preorder_items

`id`, `preorder_id`, `product_id`, `product_name`, `qty`, `unit_price`.
Stok **tidak** berubah saat pre-order dibuat. Stok berkurang saat status `done` lewat pembuatan sale (`source = preorder`). Sale yang dibuat memakai `total` = nilai **penuh** pesanan dan `deposit_applied` = DP; `paid_amount` = uang yang diterima saat ini (sisa bayar). Untuk laporan omzet, DP dihitung pada tanggal pesanan `done` (basis akrual sederhana). Catat keputusan ini di `docs/DECISIONS.md`.

### partners (mutable)

`id`, `name`, `contact`, `note`, `is_active`, `updated_at`, `deleted_at`.

### partner_prices (mutable)

`id`, `partner_id`, `product_id`, `price` (harga setoran per pcs, untuk single saja), unik (`partner_id`, `product_id`).

### consignment_drops (append-only) + `consignment_drop_items`

Drop: `id`, `partner_id`, `drop_date`, `note`. Item: `drop_id`, `product_id`, `qty`. Menulis movement `consignment_out` (negatif).

### consignment_settlements (mutable) + `consignment_settlement_items`

Settlement: `id`, `partner_id`, `period_start`, `period_end`, `total_due` (int), `status` (`unpaid|paid`), `paid_at` | null, `note`, `updated_at`.
Item: `settlement_id`, `product_id`, `sold_qty`, `returned_qty`, `unit_price` (snapshot), `unit_cost` (snapshot), `amount` (= `sold_qty × unit_price`).
Retur menulis movement `consignment_return` (positif). `terjual` tidak menulis stok (sudah keluar saat drop).
**Sisa di mitra** per produk = `Σ drops − Σ sold − Σ returned`.
Untuk laporan: omzet titip jual = `Σ amount` settlement dengan `status = paid`, pada tanggal `paid_at`; modal = `Σ sold_qty × unit_cost`.

### outbox (lokal saja)

`seq` (auto-increment), `table`, `row_id`, `op` (`insert|upsert`), `payload` (JSON), `attempts`, `status` (`pending|dead`), `last_error`, `created_at`.

### sync_state (lokal saja)

`table` (PK), `cursor` (`server_updated_at` terakhir), `last_synced_at`.

## 3. Skema Dexie (versi 1)

```ts
db.version(1).stores({
  settings: "id",
  products: "id, kind, is_active, sort_order, deleted_at",
  sales: "id, business_date, created_at, receipt_no, preorder_id",
  sale_items: "id, sale_id, product_id, stock_product_id",
  sale_voids: "id, &sale_id",
  stock_movements:
    "id, product_id, business_date, type, [product_id+business_date], ref_id",
  preorders: "id, pickup_at, status, deleted_at",
  preorder_items: "id, preorder_id",
  partners: "id, is_active, deleted_at",
  partner_prices: "id, [partner_id+product_id]",
  consignment_drops: "id, partner_id, drop_date",
  consignment_drop_items: "id, drop_id",
  consignment_settlements: "id, partner_id, status, period_end",
  consignment_settlement_items: "id, settlement_id",
  outbox: "++seq, status, table",
  sync_state: "table",
});
```

Setiap perubahan skema setelah M1 = `db.version(n+1).upgrade(...)` + migrasi SQL + minta persetujuan manusia.

## 4. SQL Supabase (ringkas, pola untuk semua tabel)

```sql
create table public.products (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  device_id text,
  name text not null,
  category text,
  kind text not null check (kind in ('single','bundle')),
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

alter table public.products enable row level security;
create policy "own rows read"   on public.products for select using (owner_id = auth.uid());
create policy "own rows insert" on public.products for insert with check (owner_id = auth.uid());
create policy "own rows update" on public.products for update using (owner_id = auth.uid());

create or replace function public.touch_server_updated_at() returns trigger as $$
begin new.server_updated_at = now(); return new; end; $$ language plpgsql;
create trigger products_touch before insert or update on public.products
  for each row execute function public.touch_server_updated_at();
```

- Tabel **append-only** (`sales`, `sale_items`, `sale_voids`, `stock_movements`, drops): hanya policy select + insert, **tanpa update**.
- Tabel **mutable**: tambahkan guard LWW: trigger `before update` yang menolak (mengembalikan `old`) jika `new.updated_at < old.updated_at`.
- Buat index `(owner_id, server_updated_at)` di tiap tabel untuk pull inkremental.
- Pull query: `select * from t where server_updated_at > :cursor order by server_updated_at asc limit 500` (ulangi hingga kosong). Gunakan `(server_updated_at, id)` sebagai kursor jika ada risiko timestamp sama.

## 4b. Tabel menu publik (Supabase)

Tabel ini tidak disinkronkan ke Dexie; hanya dipakai halaman publik dan layar POS **Menu publik**.

```sql
create table public.public_menu_items (
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
```

- RLS: `select` untuk semua (menu publik), `insert/update/delete` hanya `authenticated`.
- Foto disimpan di bucket Storage `menu` (public read, authenticated write).
- Migrasi: `supabase/migrations/003_public_menu.sql`.

## 5. Rumus domain (referensi untuk unit test)

```
subtotal       = Σ (qty × unit_price)
total          = max(0, subtotal − discount)
change_amount  = paid_amount − (total − deposit_applied)   (tunai; ≥ 0)
stock_qty      = qty × products.unit_qty        (pcs, di sale_items)
omzet (kasir)  = Σ sales.total   untuk sale TIDAK void, dalam periode
modal (kasir)  = Σ sale_items.unit_cost × qty   untuk sale TIDAK void
untung         = omzet − modal
waste (nilai)  = Σ |qty| × unit_cost            untuk movement type = waste
tagihan mitra  = Σ sold_qty × unit_price
sisa di mitra  = Σ drops − Σ sold − Σ returned
```

Contoh uji wajib:

- Paket isi 5 (harga 14.000, modal 9.000), jual 2 → stok base −10, omzet 28.000, modal 18.000.
- Jual 3 × Rp 3.000, diskon Rp 500, bayar 10.000 → total 8.500, kembalian 1.500.
- Void sale → stok kembali persis, omzet periode turun sebesar total sale.
- Ubah `cost_price` produk setelah transaksi → laba transaksi lama tidak berubah.
