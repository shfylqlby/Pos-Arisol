# POS Arisol

Kasir (POS) **offline-first** untuk lapak risol, sekaligus halaman publik **Arisol** (menu, harga, dan pre-order) dalam satu aplikasi. Jalan di HP dan laptop, bisa di-install sebagai PWA, dan tetap bisa dipakai jualan **tanpa internet**.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3ecf8e?logo=supabase&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-offline--first-5a0fc8)

## Daftar isi

- [Fitur](#fitur)
- [Arsitektur singkat](#arsitektur-singkat)
- [Peta rute](#peta-rute)
- [Mulai cepat](#mulai-cepat)
- [Environment variable](#environment-variable)
- [Setup Supabase](#setup-supabase)
- [Email notifikasi pre-order](#email-notifikasi-pre-order)
- [Perintah yang tersedia](#perintah-yang-tersedia)
- [Pengujian](#pengujian)
- [Deploy ke Vercel](#deploy-ke-vercel)
- [Struktur folder](#struktur-folder)
- [Aturan teknis penting](#aturan-teknis-penting)
- [Dokumentasi lengkap](#dokumentasi-lengkap)
- [Batasan yang diketahui](#batasan-yang-diketahui)

## Fitur

**Untuk penjual (dashboard, butuh login)**

- **Kasir cepat**: grid produk, keranjang, paket/bundle, diskon, bayar tunai (uang cepat + keypad), QRIS (gambar QR milik penjual), dan transfer. Struk bisa dibagikan ke WhatsApp, dicetak 58 mm, atau disimpan sebagai gambar.
- **Stok harian**: tambah stok, stok berkurang otomatis saat terjual, peringatan hampir habis/habis, riwayat pergerakan stok, dan wizard **Tutup hari** (selisih fisik menjadi waste atau penyesuaian).
- **Pre-order**: DP sampai selesai, kebutuhan produksi per tanggal, tombol kirim WhatsApp. Saat selesai, pesanan menjadi penjualan dan stok terpotong.
- **Titip jual**: mitra, pengiriman, setoran (terjual/retur), dan penandaan lunas.
- **Laporan**: omzet, laba, produk terlaris, metode bayar, grafik, filter periode, ekspor CSV, backup dan impor JSON.
- **Menu publik**: atur menu, harga, foto, dan **tautan ke produk stok** langsung dari POS (**Lainnya → Menu publik**).
- **Keamanan dan kenyamanan**: PIN lokal, Wake Lock layar, tema gelap, `storage.persist()`, log error dengan tombol "Salin log".

**Untuk pembeli (halaman publik `/`)**

- Menu dan harga dibaca dari Supabase (bukan hardcode), dengan label **Sisa N / Habis** untuk menu yang terhubung ke stok.
- Poster dan foto menu terbuka di lightbox dalam halaman yang sama. Tombol Back HP, Esc, atau klik latar menutupnya.
- Form pre-order dibatasi stok, lalu mengirim ringkasan pesanan ke **WhatsApp** dan (opsional) email pemilik.

## Arsitektur singkat

```
┌───────────────────────── Browser (HP / laptop) ─────────────────────────┐
│  Next.js static export (client-only)  +  Service Worker (Serwist)       │
│                                                                         │
│   UI ──► repositories ──► Dexie / IndexedDB  (sumber kebenaran lokal)   │
│                              │                                          │
│                              └── outbox ──► sync engine ─┐              │
└──────────────────────────────────────────────────────────┼──────────────┘
                                                           ▼ (saat online)
                                    Supabase: Auth + Postgres (RLS)
                                    Edge Function: notify-preorder ──► Resend
```

- **Offline-first**: semua tulis masuk ke IndexedDB (Dexie) lebih dulu. UI tidak pernah menunggu jaringan untuk aksi kasir.
- **Sync di belakang layar**: tulis lokal sekaligus menulis `outbox` dalam satu transaksi. Sync engine mendorong outbox (idempoten, retry, backoff, dead-letter) dan menarik perubahan secara inkremental. Konflik memakai last-write-wins di sisi server.
- **Statis penuh**: `output: 'export'`, tanpa SSR. Hosting statis (Vercel) cukup.
- **Stok = ledger**: stok adalah `SUM` dari `stock_movements` yang append-only, bukan angka yang ditimpa.

## Peta rute

| Rute                                      | Isi                                                 | Akses      |
| ----------------------------------------- | --------------------------------------------------- | ---------- |
| `/`                                       | Beranda Arisol: menu, harga, pre-order, FAQ, peta   | Publik     |
| `/POS`                                    | Halaman produk POS dan tombol masuk (noindex)       | Publik     |
| `/privasi`                                | Kebijakan privasi                                   | Publik     |
| `/masuk`, `/masuk/reset`                  | Login (sandi, Google, magic link) dan reset sandi   | Publik     |
| `/kasir`, `/stok`, `/pesanan`, `/laporan` | Tab utama dashboard                                 | Butuh sesi |
| `/lainnya/*`                              | Produk, menu publik, pengaturan, sinkronisasi, dll. | Butuh sesi |

`/POS` sengaja **tidak ditautkan dari beranda**, tidak masuk `sitemap.xml`, dan di-`Disallow` di `robots.txt`.

## Mulai cepat

Prasyarat: **Node 22** dan **pnpm 10**.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Tanpa env Supabase, aplikasi berjalan di **mode lokal**: langsung masuk ke `/kasir`, data hanya di perangkat, dan tidak ada sync. Cocok untuk mencoba semua fitur kasir.

Untuk memakai login dan sync, salin env dulu:

```powershell
Copy-Item .env.example .env.local   # Windows PowerShell
# cp .env.example .env.local        # macOS / Linux
```

Lalu isi `NEXT_PUBLIC_SUPABASE_ANON_KEY` (lihat bawah).

## Environment variable

| Variabel                        | Wajib       | Keterangan                                                      |
| ------------------------------- | ----------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Untuk cloud | URL project Supabase                                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Untuk cloud | Kunci **anon/public** dari Project Settings → API               |
| `NEXT_PUBLIC_SITE_URL`          | Produksi    | Domain publik, dipakai sitemap, robots, dan metadata Open Graph |
| `NEXT_PUBLIC_LOCAL_MODE`        | Opsional    | `1` memaksa mode lokal (dipakai tes e2e)                        |

> **Penting**
>
> - Nilai `NEXT_PUBLIC_*` **dibaca saat build**. Setelah mengubahnya di Vercel, lakukan **Redeploy**.
> - **Jangan pernah** memakai `service_role` key di variabel `NEXT_PUBLIC_*`.
> - `.env` dan `.env.local` sudah di-ignore git. Hanya `.env.example` (berisi placeholder) yang boleh di-commit.
> - Client ID/Secret Google **tidak** ditaruh di env aplikasi. Isi di Supabase Dashboard → Authentication → Providers → Google.

## Setup Supabase

1. Buat project Supabase, lalu salin URL dan anon key ke env.
2. Di **SQL Editor**, jalankan migrasi **berurutan**:

   | File                                                      | Fungsi                                                                     |
   | --------------------------------------------------------- | -------------------------------------------------------------------------- |
   | `supabase/migrations/001_initial_schema.sql`              | Skema inti, RLS, trigger `server_updated_at`                               |
   | `supabase/migrations/002_settings_qris_image_and_lww.sql` | Gambar QRIS di pengaturan dan guard last-write-wins                        |
   | `supabase/migrations/003_public_menu.sql`                 | Tabel `public_menu_items`, bucket foto `menu`, RLS, menu awal              |
   | `supabase/migrations/004_public_menu_stock.sql`           | Kolom `product_id` dan view `public_menu_with_stock` (stok agregat publik) |

3. **Authentication → Providers → Email**: matikan pendaftaran publik (**Allow new users to sign up** = off). Akun dibuat manual oleh pemilik lewat **Authentication → Users → Add user** (centang _Auto Confirm User_).
4. **Authentication → URL Configuration**: isi Site URL dan Redirect URLs dengan domain produksi, termasuk `/masuk` dan `/masuk/reset`. Tanpa ini login dan reset sandi dari domain produksi gagal.
5. (Opsional) Aktifkan provider **Google** bila ingin login Google.
6. Di POS, buka **Lainnya → Menu publik**, lalu pilih **Produk stok** per menu supaya halaman publik menampilkan sisa stok.

View `public_menu_with_stock` hanya mengekspos **angka stok agregat**, bukan tabel stok mentah.

## Email notifikasi pre-order

Opsional. Tanpa ini, form pre-order tetap terkirim lewat WhatsApp. Edge Function `notify-preorder` mengirim email ke pemilik lewat [Resend](https://resend.com).

```bash
npm i -g supabase
supabase login
supabase link --project-ref <project-ref>
supabase functions deploy notify-preorder

supabase secrets set RESEND_API_KEY=... PREORDER_NOTIFY_EMAIL=email-pemilik@contoh.com
# opsional
supabase secrets set PREORDER_FROM_EMAIL="Arisol <noreply@domainmu.com>"
supabase secrets set ALLOWED_ORIGIN=https://domain-produksimu.com
```

Yang dilakukan function demi keamanan:

- **Harga dihitung ulang dari database** (`public_menu_items`). Harga dari klien tidak dipercaya, dan nama item harus menu aktif yang asli.
- Semua field divalidasi dan dibatasi panjangnya.
- **Rate limit**: 5 permintaan per 10 menit per IP, dan 60 per jam secara global.
- CORS bisa dikunci ke domain produksi lewat `ALLOWED_ORIGIN`.

Tanpa domain yang diverifikasi di Resend, pengirim bawaan `onboarding@resend.dev` hanya bisa mengirim ke email pemilik akun Resend.

## Perintah yang tersedia

| Perintah                | Fungsi                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| `pnpm dev`              | Dev server di `http://localhost:3000`                            |
| `pnpm build`            | Build produksi statis + service worker                           |
| `pnpm lint`             | ESLint                                                           |
| `pnpm typecheck`        | `tsc --noEmit`                                                   |
| `pnpm test`             | Unit test (Vitest)                                               |
| `pnpm test:e2e`         | E2E Playwright (dev server di port 3002)                         |
| `pnpm test:e2e:ui`      | E2E dengan UI Playwright                                         |
| `pnpm test:e2e:offline` | Build produksi + service worker, lalu uji semua tab saat offline |
| `pnpm format`           | Prettier                                                         |

## Pengujian

- **Unit (Vitest)**: logika domain (`money`, `cart`, `stock`, `reports`, `consignment`), skema Zod, dan sync (`push`, `pull`) dengan Supabase tiruan.
- **E2E (Playwright)**: jual tunai dan struk, void mengembalikan stok, tutup hari, pre-order DP sampai selesai, titip jual, riwayat stok, lightbox menu, dan audit aksesibilitas (`axe`) di tab utama.
- **E2E offline**: build produksi lalu reload semua tab dengan jaringan mati.

Tes e2e memakai folder build terpisah (`.next-e2e`) dan mode lokal, jadi aman dijalankan berdampingan dengan dev server di port 3000.

Sebelum deploy, semua ini harus hijau:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm test:e2e && pnpm test:e2e:offline
```

## Deploy ke Vercel

1. Import repo ke Vercel. Framework **Next.js** terdeteksi otomatis.
2. Isi env **Production**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.
3. Deploy. Pastikan Site URL dan Redirect URLs di Supabase sudah memuat domain Vercel.
4. `vercel.json` sudah mengatur header `Cache-Control: max-age=0, must-revalidate` untuk `sw.js` dan `manifest.webmanifest`, supaya pembaruan service worker terdeteksi. `headers()` di `next.config` tidak berlaku pada `output: 'export'`, makanya memakai `vercel.json`.
5. Uji di HP: buka online, install ke layar utama, matikan jaringan, lalu reload tiap tab.

## Struktur folder

```
src/
├─ app/            Rute Next.js: (app)/ untuk dashboard, masuk/, POS/, privasi/
├─ domain/         Logika murni: money, cart, stock, reports, consignment (+ unit test)
├─ data/
│  ├─ db.ts        Skema Dexie
│  ├─ repositories/  Satu-satunya jalan ke IndexedDB (menulis outbox dalam transaksi)
│  └─ sync/        Push/pull, outbox, klien Supabase
├─ features/       auth, pos, stock, orders, consignment, reports, products, settings, landing
├─ shell/          Tab bar HP, sidebar desktop, header, chip sync
├─ ui/             Komponen UI sendiri (tanpa library UI besar)
├─ providers/      Provider aplikasi
└─ lib/            id (ULID), date (zona waktu), util
supabase/
├─ migrations/     001 sampai 004
└─ functions/notify-preorder/   Edge Function email (Deno)
e2e/               Tes Playwright
docs/              PRD, UX, arsitektur, model data, roadmap, keputusan
```

## Aturan teknis penting

- **Uang = integer rupiah**, tidak pernah float. Tampilan lewat `formatRupiah()`.
- **Offline-first**: aksi kasir tidak boleh `await` jaringan. Tulis ke Dexie dulu.
- **Komponen tidak boleh mengimpor `@/data/db`**. Akses data lewat `src/data/repositories/*`.
- **Append-only**: penjualan dan pergerakan stok tidak diedit. Koreksi lewat void/reversal.
- **ID dibuat di klien** (ULID). "Hari" bisnis memakai zona waktu `Asia/Jakarta`.
- **Stok publik tidak mereservasi**: pre-order dari halaman publik tidak memotong stok. Stok baru berkurang saat penjualan tercatat di POS.
- Keputusan arsitektur dan produk dicatat di [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Dokumentasi lengkap

Mulai dari [`docs/00-README.md`](docs/00-README.md):

| File                                                 | Isi                                          |
| ---------------------------------------------------- | -------------------------------------------- |
| [`docs/01-PRD.md`](docs/01-PRD.md)                   | Masalah, persona, fitur, acceptance criteria |
| [`docs/02-UX-UI.md`](docs/02-UX-UI.md)               | Navigasi, wireframe, design token            |
| [`docs/03-ARCHITECTURE.md`](docs/03-ARCHITECTURE.md) | Stack, offline-first, sync                   |
| [`docs/04-DATA-MODEL.md`](docs/04-DATA-MODEL.md)     | Skema Dexie + SQL Supabase                   |
| [`docs/05-ROADMAP.md`](docs/05-ROADMAP.md)           | Milestone M0 sampai M8 dan checklist         |
| [`docs/AGENTS.md`](docs/AGENTS.md)                   | Aturan kerja untuk AI agent                  |
| [`docs/DECISIONS.md`](docs/DECISIONS.md)             | Catatan keputusan                            |

## Batasan yang diketahui

- Rate limit email hanya di memori per instance Edge Function. Cukup untuk spam biasa, belum untuk serangan serius.
- Jika menu publik jatuh ke daftar cadangan (Supabase tidak terjangkau), email pre-order tidak terkirim karena harga tidak bisa diverifikasi. WhatsApp tetap berjalan.
- Dua pembeli bisa memesan stok terakhir yang sama, karena stok tidak direservasi. Penjual mengonfirmasi lewat WhatsApp.
- Belum selesai di roadmap: tes RLS antar-pengguna, e2e dua perangkat, uji di HP asli (Android dan iPhone, layar 360 px), uji kinerja dengan data besar, dan aktivasi backup Supabase.
- Cetak struk Bluetooth bukan bagian MVP. QRIS hanya menampilkan gambar QR statis dengan konfirmasi manual.

## Lisensi

Belum ada berkas lisensi. Seluruh hak dipegang pemilik repositori.
