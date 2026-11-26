# 03. Arsitektur

## 1. Keputusan dan alasan

| Keputusan       | Pilihan                                                                                                                                                                                                                                     | Alasan                                                                                                     | Alternatif yang ditolak                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Bentuk aplikasi | **Next.js (App Router) dipakai sebagai app client-only + PWA**, di-deploy ke **Vercel**                                                                                                                                                     | Keputusan pemilik produk. Offline-first, bisa di-install, satu kode untuk HP dan PC                        | Vite SPA (lebih sederhana untuk kasus ini, tapi ditolak oleh pemilik produk; lihat bagian 1a) |
| Build           | Next.js (versi stabil terbaru, di-pin) + React + TS strict, **`output: 'export'`** (static export)                                                                                                                                          | Semua halaman jadi HTML/JS statis yang bisa di-precache service worker; Vercel melayani statis dengan baik | SSR/Server Components untuk data: dilarang (lihat 1a)                                         |
| Styling         | Tailwind CSS                                                                                                                                                                                                                                | Cepat, token konsisten                                                                                     | Library UI berat                                                                              |
| Data lokal      | **IndexedDB via Dexie**                                                                                                                                                                                                                     | Query reaktif (`useLiveQuery`), transaksi, migrasi                                                         | localStorage (terlalu kecil), SQLite WASM (lebih berat, OPFS belum merata di iOS)             |
| Cloud           | **Supabase** (Auth + Postgres + RLS)                                                                                                                                                                                                        | Gratis untuk skala kecil, auth siap pakai, SQL                                                             | Firebase (model data kurang cocok untuk laporan relasional)                                   |
| Sync            | Outbox + pull inkremental buatan sendiri                                                                                                                                                                                                    | Skala 1 pengguna, aturan sederhana, mudah dites                                                            | CRDT/PowerSync/ElectricSQL (berlebihan untuk MVP)                                             |
| Routing         | Next.js App Router (file-based, `next/link`, `useRouter`)                                                                                                                                                                                   | Bawaan framework                                                                                           | React Router (tidak dipakai, jangan dipasang)                                                 |
| Validasi        | Zod                                                                                                                                                                                                                                         | Satu skema untuk form, impor, dan data sync                                                                | -                                                                                             |
| Test            | Vitest (unit), Playwright (e2e, termasuk offline)                                                                                                                                                                                           | -                                                                                                          | -                                                                                             |
| PWA             | **Serwist** (`@serwist/next`, atau paket Turbopack-nya jika versi Next yang dipakai memakai Turbopack untuk build). Verifikasi dukungan versi di dokumentasi resmi Serwist sebelum memilih; jika perlu, build dengan `next build --webpack` | Precache seluruh aset dan halaman statis, update dengan prompt                                             | `next-pwa` (tidak dirawat lagi)                                                               |
| Backend         | **Supabase** saja (Auth + Postgres + RLS), diakses langsung dari klien lewat `@supabase/supabase-js`                                                                                                                                        | Keputusan pemilik produk. Tidak ada server sendiri                                                         | Route Handlers/Server Actions Next.js untuk logika bisnis (lihat 1a)                          |

### 1a. Aturan khusus Next.js untuk app offline-first

Next.js dirancang untuk server-rendering, sedangkan kasir ini harus jalan tanpa server. Agar keduanya tidak bertabrakan:

1. **Semua halaman fitur adalah Client Component** (`'use client'`). Dexie, `useLiveQuery`, Zustand, Web APIs hanya jalan di klien. Dilarang mengambil data di Server Component, `getServerSideProps`, Route Handler, atau Server Action untuk alur kasir.
2. **`output: 'export'`** di `next.config`. Konsekuensinya: tanpa middleware, tanpa Route Handler, tanpa Server Action, tanpa ISR, `images.unoptimized: true`. Auth Supabase dijalankan di sisi klien (session di localStorage), bukan lewat cookie SSR.
3. **Hindari rute dinamis `[id]`** (butuh `generateStaticParams` dan tidak bisa untuk ID yang dibuat saat offline). Pakai query string: `/pesanan/detail?id=...`, `/laporan/transaksi?id=...`, dibaca dengan `useSearchParams` (dibungkus `Suspense`).
4. **Tidak boleh ada hydration mismatch dari data lokal.** Render skeleton sampai Dexie siap; jangan membaca `localStorage`/`navigator`/`Date.now()` saat render pertama.
5. **Service worker** harus mem-precache semua halaman statis hasil export dan aset `_next/static`, sehingga navigasi antar halaman dan reload tetap jalan offline. Tes e2e wajib: buka app online, matikan jaringan, reload di setiap rute utama.
6. Env publik Supabase lewat `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Jangan pernah memakai `service_role` di kode klien atau di repo.
7. Jika suatu hari butuh fitur server (webhook pembayaran, email), keputusan ini ditinjau ulang; catat di `docs/DECISIONS.md` dan minta persetujuan manusia. Jangan mengaktifkan SSR diam-diam.

**Mengapa tidak langsung online-only?** Sinyal di lokasi jualan tidak bisa diandalkan, dan transaksi tidak boleh gagal. Pemilik punya dua perangkat sehingga sync tetap diperlukan, tapi sebagai proses latar belakang.

## 2. Struktur folder

```
pos-risol/
├─ AGENTS.md
├─ docs/                 # salin 00-05 + DECISIONS.md
├─ public/               # ikon PWA, manifest assets
├─ src/
│  ├─ app/               # Next.js App Router: layout.tsx, page.tsx per rute (tipis, hanya merakit features/*)
│  │  ├─ layout.tsx      # root layout, font, metadata PWA (tanpa shell)
│  │  ├─ page.tsx        # Beranda Arisol (publik, info + pre-order)
│  │  ├─ POS/page.tsx    # Info produk POS (publik, CTA ke /masuk)
│  │  ├─ masuk/page.tsx  # Login (email+sandi, Google, magic link)
│  │  └─ (app)/          # Rute dashboard, dibungkus Providers + AuthGate + AppShell
│  │     ├─ layout.tsx   # Providers, AuthGate, AppShell
│  │     ├─ kasir/ stok/ pesanan/ laporan/ lainnya/   # rute per tab
│  │  ├─ sw.ts           # service worker (Serwist)
│  │  └─ manifest.ts     # web app manifest
│  ├─ shell/             # AppShell, TabBar, Sidebar, Header, guards
│  ├─ providers/         # Providers (db ready, sync engine, toast, tema)
│  ├─ domain/            # LOGIKA MURNI + test (tanpa React/Dexie)
│  │  ├─ money.ts        # formatRupiah, parse, kembalian
│  │  ├─ cart.ts         # tambah/hapus item, total, diskon
│  │  ├─ stock.ts        # hitung stok dari movements
│  │  ├─ reports.ts      # omzet, modal, untung, terlaris
│  │  ├─ consignment.ts  # tagihan setoran, sisa di mitra
│  │  └─ receipt.ts      # susun struk (teks/HTML)
│  ├─ data/
│  │  ├─ db.ts           # skema Dexie + versi/migrasi
│  │  ├─ schemas.ts      # Zod untuk semua entitas
│  │  ├─ repositories/   # products, sales, stock, preorders, partners, settings
│  │  └─ sync/           # outbox.ts, push.ts, pull.ts, engine.ts, supabase.ts
│  ├─ features/
│  │  ├─ pos/            # layar Kasir, Bayar, Sukses
│  │  ├─ stock/          # Stok, Produksi, Tutup hari
│  │  ├─ orders/         # Pre-order
│  │  ├─ consignment/    # Titip jual
│  │  ├─ reports/
│  │  ├─ products/
│  │  └─ settings/
│  ├─ ui/                # komponen dasar (lihat 02-UX-UI bagian 5)
│  └─ lib/               # id (ulid), date (zona waktu), device, csv, share
├─ supabase/
│  ├─ migrations/        # SQL dari 04-DATA-MODEL
│  └─ seed.sql
├─ tests/e2e/
├─ next.config.ts        # output: 'export', Serwist
└─ vercel.json           # (opsional) header cache untuk sw.js dan manifest
```

Aturan dependensi: `app` → `shell`/`features`. `features` → `data`/`domain`/`ui`/`lib`. `domain` tidak mengimpor apa pun dari proyek selain tipe. `ui` tidak tahu `data`.

## 3. Alur data offline-first

```
UI event ─► repository.write()
              ├─ Dexie transaction:
              │    1. tulis baris ke tabel utama
              │    2. tulis baris ke tabel `outbox` (op: upsert/insert, table, row_id, payload)
              └─ selesai (UI langsung update lewat useLiveQuery)

Sync engine (latar belakang)
  trigger: app start, event `online`, interval 30 dtk saat online, setelah tiap tulis (debounce 2 dtk)
  1. PUSH: kirim outbox berurutan (batch ≤ 50) ke Supabase, hapus dari outbox bila sukses
  2. PULL: ambil baris dengan `server_updated_at` > cursor per tabel, tulis ke Dexie (tanpa memasukkan ke outbox)
  3. update `sync_state` (cursor, last_synced_at, error)
```

- Push idempoten: `upsert ... on conflict (id)`. Retry dengan backoff eksponensial (2, 4, 8… maks 5 menit).
- Gagal permanen (validasi 4xx): tandai item outbox `dead`, tampilkan di Pengaturan → Sinkronisasi, jangan memblokir item lain.
- Sebelum login: outbox tetap terisi; setelah login pertama, `owner_id` diisi dan seluruh data lokal di-push (initial upload).
- Perangkat baru setelah login: pull penuh dari cursor 0.

## 4. Aturan konflik

Karena 1 pemilik dan data transaksi bersifat tambah-saja, konflik jarang dan sederhana:

| Jenis data      | Tabel                                                                               | Strategi                                                                                                                           |
| --------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Append-only     | `sales`, `sale_items`, `sale_voids`, `stock_movements`, `consignment_drops`(+items) | Tidak pernah ada konflik. ID klien unik. `on conflict do nothing`.                                                                 |
| Master mutable  | `products`, `partners`, `partner_prices`, `settings`                                | **Last-write-wins** per baris berdasarkan `updated_at`. Server menolak tulis yang `updated_at`-nya lebih lama dari yang tersimpan. |
| Dokumen mutable | `preorders`(+items), `consignment_settlements`(+items)                              | LWW per baris; item anak diganti utuh bersama induk (kirim induk + anak dalam satu payload).                                       |
| Hapus           | semua master                                                                        | Soft delete: `deleted_at`. Baris dengan `deleted_at` tidak tampil, tetap disinkron.                                                |

- **Stok tidak punya konflik** karena dihitung dari ledger. Dua perangkat yang menjual produk sama saat offline akan menghasilkan stok negatif sementara; itu diterima dan ditampilkan apa adanya (peringatan, bukan error).
- **Nomor struk:** format `{kodePerangkat}-{urut 4 digit}` per hari bisnis, mis. `A-0012`. Kode perangkat (A, B, …) dipilih saat pertama setup di Pengaturan. Tidak ada tabrakan antar perangkat.
- **Jam perangkat salah:** `created_at` dipakai untuk urutan tampil; `business_date` dihitung di klien dari zona waktu pengaturan. Tampilkan peringatan jika selisih jam perangkat vs server > 5 menit saat sync.

## 5. Keamanan

- Supabase Auth (magic link + Google). Semua tabel punya `owner_id uuid` dan **RLS**: `owner_id = auth.uid()` untuk select/insert/update. Tidak ada delete dari klien.
- Kunci `anon` di klien itu publik; keamanan sepenuhnya di RLS. Tulis tes SQL/Playwright yang memastikan pengguna A tidak bisa membaca data B.
- PIN lokal hanya untuk kenyamanan (mencegah buka iseng), bukan enkripsi. Hash PIN dengan `crypto.subtle` (PBKDF2) dan simpan di Dexie `settings`.
- Gambar QRIS dan foto produk disimpan sebagai Blob lokal (ukuran maks 300 KB setelah kompres). Sync file ke Supabase Storage dijadwalkan setelah MVP; sebelum itu tersimpan lokal per perangkat dan ditandai di UI.
- Jangan pernah mencatat data pelanggan (nama, WA) ke log atau analytics.

## 6. PWA

- `manifest` (`src/app/manifest.ts`): nama, `display: standalone`, `orientation: any`, `theme_color` = `--primary`, ikon 192/512 + maskable.
- Precache semua aset build, font self-host (`@fontsource`, bukan `next/font/google` yang mengambil dari jaringan), ikon, dan halaman statis hasil export. Fallback navigasi ke halaman offline/`/` bila rute tidak ada di cache.
- Di Vercel, pastikan `sw.js` dilayani dengan `Cache-Control: no-cache` agar update service worker terdeteksi (atur di `vercel.json` atau `next.config` headers; catatan: `headers()` tidak berlaku pada `output: 'export'`, jadi pakai `vercel.json`).
- Update: tampilkan toast "Versi baru tersedia" [Muat ulang] dan **jangan reload otomatis** saat keranjang tidak kosong.
- `navigator.storage.persist()` diminta setelah onboarding supaya browser tidak menghapus IndexedDB.
- iOS: tampilkan petunjuk "Tambah ke Layar Utama"; ingatkan backup berkala (data iOS Safari bisa dibersihkan jika tidak dipakai lama).
- `Wake Lock` pada halaman Kasir bila didukung.

## 7. Struk dan berbagi

- `domain/receipt.ts` menghasilkan model struk; renderer: (a) teks WhatsApp, (b) HTML untuk `window.print()` dengan stylesheet 58 mm, (c) PNG via `html-to-image` untuk dibagikan dengan Web Share API (`navigator.share({files})`), fallback unduh.
- Stretch (setelah M8): cetak ESC/POS lewat Web Bluetooth (Android Chrome saja).

## 8. Strategi test

| Level            | Cakupan wajib                                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (Vitest)    | `money`, `cart` (paket, diskon, pembulatan), `stock` (ledger, void, waste), `reports` (omzet/modal/untung dengan snapshot harga modal), `consignment` (tagihan, sisa), nomor struk |
| Integrasi        | Repository + Dexie (fake-indexeddb): tulis sale → movements + outbox terbentuk dalam satu transaksi                                                                                |
| Sync             | Mock Supabase: push idempoten, retry, LWW, pull inkremental, initial upload                                                                                                        |
| E2E (Playwright) | (1) jual tunai offline, (2) void mengembalikan stok, (3) tutup hari, (4) pre-order sampai selesai, (5) setoran titip jual, (6) offline → online, outbox terkirim                   |
| Aksesibilitas    | `axe` pada layar utama                                                                                                                                                             |

## 9. Observabilitas

- Tanpa analytics pihak ketiga di MVP. Log error lokal (ring buffer 200 entri) yang bisa disalin dari Pengaturan → "Salin log" untuk dukungan.
- Opsional setelah pilot: Sentry dengan scrub data pelanggan.
