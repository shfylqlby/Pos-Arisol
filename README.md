# POS Arisol

Aplikasi kasir untuk lapak risol, plus halaman publik Arisol (menu, harga, pre-order) di project yang sama. Bisa dipakai di HP maupun laptop, bisa di-install sebagai PWA, dan tetap jalan waktu internet mati.

Stack: Next.js 14 (static export), React 18, TypeScript, Tailwind, Dexie (IndexedDB), Supabase (auth + Postgres), Serwist untuk service worker.

## Isi

- [Fitur](#fitur)
- [Cara kerjanya](#cara-kerjanya)
- [Rute](#rute)
- [Jalankan di lokal](#jalankan-di-lokal)
- [Environment variable](#environment-variable)
- [Setup Supabase](#setup-supabase)
- [Email pre-order](#email-pre-order)
- [Deploy ke Vercel](#deploy-ke-vercel)
- [Perintah dan tes](#perintah-dan-tes)
- [Struktur folder](#struktur-folder)
- [Catatan teknis](#catatan-teknis)
- [Dokumen lain](#dokumen-lain)
- [Keterbatasan](#keterbatasan)

## Fitur

Dashboard penjual (perlu login):

- Kasir: grid produk, keranjang, paket, diskon, bayar tunai / QRIS / transfer. Struk bisa dikirim ke WhatsApp, dicetak 58 mm, atau disimpan jadi gambar.
- Stok: tambah stok harian, stok berkurang sendiri tiap ada penjualan, peringatan stok menipis, riwayat, dan tutup hari (selisih stok fisik dicatat sebagai waste atau penyesuaian).
- Pre-order: dari DP sampai selesai, kebutuhan produksi per tanggal, kirim ke WhatsApp.
- Titip jual: mitra, kirim barang, setoran, lunas.
- Laporan: omzet, laba, produk terlaris, metode bayar, ekspor CSV, backup dan impor JSON.
- Menu publik: ubah menu, harga, foto, dan hubungkan ke produk stok dari menu Lainnya.
- Lainnya: PIN lokal, tema gelap, log error yang bisa disalin.

Halaman publik `/`:

- Menu dan harga diambil dari Supabase. Menu yang dihubungkan ke stok menampilkan "Sisa N" atau "Habis".
- Poster dan foto menu dibuka di lightbox, bisa ditutup dengan tombol Tutup, Esc, klik area gelap, atau tombol Back di HP.
- Form pre-order membatasi jumlah sesuai stok, lalu membuka WhatsApp dengan ringkasan pesanan. Kalau email sudah disetel, pemilik juga dapat email.

## Cara kerjanya

```
Browser (HP / laptop)
  Next.js static + service worker
  UI -> repository -> Dexie (IndexedDB)
                         |
                         +-- outbox -> sync -> Supabase (Auth, Postgres + RLS)
                                               Edge Function notify-preorder -> Resend
```

Semua data ditulis ke IndexedDB dulu, jadi kasir tidak pernah menunggu jaringan. Setiap tulis juga mengisi tabel `outbox` dalam transaksi yang sama. Saat online, sync mengirim isi outbox ke Supabase (dengan retry dan dead-letter) dan menarik perubahan dari server. Kalau ada konflik, data terbaru yang menang.

Stok tidak disimpan sebagai angka tunggal, tapi dihitung dari jumlah `stock_movements` yang hanya bertambah (tidak diedit).

## Rute

| Rute                                      | Isi                                           | Akses       |
| ----------------------------------------- | --------------------------------------------- | ----------- |
| `/`                                       | Beranda: menu, harga, pre-order, FAQ, peta    | Publik      |
| `/POS`                                    | Halaman produk POS dan tombol masuk           | Publik      |
| `/privasi`                                | Kebijakan privasi                             | Publik      |
| `/masuk`, `/masuk/reset`                  | Login dan reset kata sandi                    | Publik      |
| `/kasir`, `/stok`, `/pesanan`, `/laporan` | Tab utama dashboard                           | Perlu login |
| `/lainnya/*`                              | Produk, menu publik, pengaturan, sinkronisasi | Perlu login |

`/POS` sengaja tidak ditautkan dari beranda, tidak ada di sitemap, di-disallow di `robots.txt`, dan diberi noindex.

## Jalankan di lokal

Butuh Node 22 dan pnpm 10.

```bash
pnpm install
pnpm dev
```

Buka http://localhost:3000. Kalau env Supabase belum diisi, aplikasi jalan dalam mode lokal: langsung masuk ke `/kasir`, data hanya ada di perangkat, tanpa login dan tanpa sync. Cukup untuk mencoba fitur kasir.

Untuk login dan sync, siapkan env dulu (lihat bagian berikutnya):

```powershell
Copy-Item .env.example .env.local   # PowerShell
# cp .env.example .env.local        # macOS / Linux
```

## Environment variable

Ada dua tempat yang terpisah. Jangan sampai tertukar.

| Tempat                   | Dipakai oleh                    | Dibaca kapan                                |
| ------------------------ | ------------------------------- | ------------------------------------------- |
| Vercel atau `.env.local` | Aplikasi Next.js (browser)      | Saat build, jadi harus redeploy bila diubah |
| Secrets Supabase         | Edge Function `notify-preorder` | Saat function jalan                         |

### Env aplikasi (Vercel dan `.env.local`)

| Variabel                        | Wajib              | Isi                                                                                       |
| ------------------------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Ya, untuk cloud    | Project URL, contoh `https://abcdxyz.supabase.co`                                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ya, untuk cloud    | Kunci anon / publishable dari dashboard Supabase                                          |
| `NEXT_PUBLIC_SITE_URL`          | Ya, untuk produksi | Domain situs, contoh `https://arisol.vercel.app`. Dipakai sitemap, robots, dan Open Graph |
| `NEXT_PUBLIC_LOCAL_MODE`        | Tidak              | `1` untuk memaksa mode lokal. Dipakai tes e2e, jangan diisi di produksi                   |

Di Vercel: Project, Settings, Environment Variables. Tambahkan tiga variabel pertama untuk Production, simpan, lalu Redeploy. Redeploy wajib karena nilai `NEXT_PUBLIC_*` ditanam ke JavaScript waktu build.

Hal yang perlu diingat:

- Jangan taruh `service_role` key di variabel `NEXT_PUBLIC_*`. Variabel itu ikut ke browser dan bisa dilihat siapa saja. Anon key aman karena akses data dibatasi RLS.
- `.env` dan `.env.local` sudah masuk `.gitignore`. Yang ikut ke git cuma `.env.example`.
- Client ID dan Secret Google tidak dipakai di aplikasi. Keduanya diisi di dashboard Supabase.

### Secret Edge Function (hanya kalau pakai email pre-order)

Disetel lewat `supabase secrets set` atau dashboard Supabase, bukan di Vercel.

| Secret                  | Wajib     | Isi                                                                               |
| ----------------------- | --------- | --------------------------------------------------------------------------------- |
| `RESEND_API_KEY`        | Ya        | API key dari Resend (`re_...`)                                                    |
| `PREORDER_NOTIFY_EMAIL` | Ya        | Email yang menerima notifikasi                                                    |
| `PREORDER_FROM_EMAIL`   | Tidak     | Pengirim, contoh `Arisol <noreply@domainmu.com>`. Default `onboarding@resend.dev` |
| `ALLOWED_ORIGIN`        | Sebaiknya | Domain situs untuk membatasi CORS. Default `*`                                    |

`SUPABASE_URL` dan `SUPABASE_ANON_KEY` sudah disediakan otomatis oleh Supabase untuk Edge Function.

## Setup Supabase

Kira-kira 15 menit. Kerjakan berurutan.

### 1. Buat project dan ambil kunci

1. Buka dashboard Supabase, pilih New project, pilih region terdekat (misalnya Singapore), dan simpan password database.
2. Setelah project jadi, buka Project Settings, API.
3. Salin Project URL ke `NEXT_PUBLIC_SUPABASE_URL`, dan anon / publishable key ke `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Jangan pakai `service_role` / secret key di aplikasi.

### 2. Jalankan migrasi

Buka SQL Editor, New query. Untuk tiap file di bawah, salin seluruh isinya, tempel, lalu Run. Urutannya harus sama dan tiap file cukup dijalankan sekali.

| File                                                      | Isinya                                                                      |
| --------------------------------------------------------- | --------------------------------------------------------------------------- |
| `supabase/migrations/001_initial_schema.sql`              | Tabel inti, RLS per pemilik (`owner_id = auth.uid()`), trigger waktu server |
| `supabase/migrations/002_settings_qris_image_and_lww.sql` | Kolom gambar QRIS dan guard konflik (last write wins)                       |
| `supabase/migrations/003_public_menu.sql`                 | Tabel `public_menu_items`, 12 menu awal, bucket foto `menu`, policy storage |
| `supabase/migrations/004_public_menu_stock.sql`           | Kolom `product_id` dan view `public_menu_with_stock`                        |

File 001 tidak memakai `drop policy if exists`. Kalau terlanjur dijalankan dua kali, akan muncul error "policy already exists". Datanya tidak rusak, errornya boleh diabaikan.

Untuk mengecek hasilnya:

```sql
select count(*) from public.public_menu_items;                    -- 12
select id, stock_qty from public.public_menu_with_stock limit 3;  -- tidak error
select id, public from storage.buckets where id = 'menu';         -- public = true
```

### 3. Matikan pendaftaran publik

Aplikasi ini untuk satu pemilik. Kalau pendaftaran dibiarkan terbuka, siapa pun bisa bikin akun.

1. Buka Authentication, bagian Sign In / Providers (di dashboard versi lama: Providers, Email).
2. Pastikan Email aktif.
3. Matikan "Allow new users to sign up", lalu Save.

### 4. Buat akun pemilik

1. Authentication, Users, Add user, Create new user.
2. Isi email dan password.
3. Centang Auto Confirm User. Kalau tidak, akun belum bisa dipakai login.

Akun ini yang dipakai login di `/masuk`.

### 5. Atur URL redirect

Kalau langkah ini terlewat, magic link, login Google, dan reset kata sandi akan gagal atau malah mengarah ke `localhost`.

1. Authentication, URL Configuration.
2. Site URL: domain produksi, misalnya `https://arisol.vercel.app`.
3. Redirect URLs, tambahkan `https://arisol.vercel.app/**` dan `http://localhost:3000/**`.
4. Save.

Aplikasi memakai `/masuk/reset` untuk reset kata sandi, dan `/lainnya/sinkronisasi` untuk magic link dan Google.

### 6. Login Google (boleh dilewati)

1. Di Google Cloud Console, buat OAuth client ID bertipe Web application.
2. Isi Authorized redirect URI dengan `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Di Supabase, buka Authentication, Providers, Google. Aktifkan, tempel Client ID dan Secret, lalu Save.

Karena pendaftaran publik dimatikan, akun Google hanya bisa masuk kalau emailnya sudah terdaftar.

### 7. Hubungkan menu ke stok

1. Login ke POS, buka Lainnya, Menu publik.
2. Di tiap menu, pilih produk stoknya.
3. Halaman `/` akan menampilkan "Sisa N" atau "Habis" dan membatasi jumlah pre-order.

Menu yang tidak dihubungkan dianggap tanpa batas stok.

### 8. Cek hasilnya

- `/` menampilkan menu dari database, bukan daftar contoh.
- Login di `/masuk` dengan akun langkah 4 berhasil dan masuk ke `/kasir`.
- Buat satu penjualan, lalu lihat Lainnya, Sinkronisasi: antrean kosong.
- Di Table Editor Supabase, tabel `sales` terisi.

View `public_menu_with_stock` hanya mengeluarkan angka stok total. Tabel lain (penjualan, stok, pre-order) cuma bisa dibaca pemiliknya lewat RLS.

### Kalau ada masalah

| Gejala                                     | Kemungkinan penyebab                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| Langsung masuk `/kasir` tanpa login        | Env Supabase tidak terbaca, jadi jalan di mode lokal. Isi env lalu redeploy. |
| `Invalid login credentials`                | Akun belum dibuat, belum Auto Confirm, atau password salah (langkah 4).      |
| Magic link atau Google membuka `localhost` | Site URL belum diganti ke domain produksi (langkah 5).                       |
| `Signups not allowed for otp`              | Email belum terdaftar. Buat dulu di langkah 4.                               |
| Menu tampil tapi tanpa label stok          | Menu belum dihubungkan ke produk (langkah 7), atau migrasi 004 belum jalan.  |
| Menu yang tampil adalah menu contoh        | Migrasi 003 belum jalan, atau URL / key Supabase salah.                      |
| Upload foto menu gagal                     | Bucket `menu` belum ada. Jalankan ulang migrasi 003.                         |
| Email pre-order tidak masuk                | Function belum di-deploy atau secret belum diisi (bagian berikut).           |

## Email pre-order

Opsional. Tanpa ini, form tetap jalan lewat WhatsApp. Function `notify-preorder` mengirim email ke pemilik lewat [Resend](https://resend.com).

```bash
npm i -g supabase
supabase login
supabase link --project-ref <project-ref>
supabase functions deploy notify-preorder

supabase secrets set RESEND_API_KEY=... PREORDER_NOTIFY_EMAIL=email-pemilik@contoh.com
supabase secrets set PREORDER_FROM_EMAIL="Arisol <noreply@domainmu.com>"   # opsional
supabase secrets set ALLOWED_ORIGIN=https://domainmu.com                    # sebaiknya diisi
```

Perilaku function:

- Harga dihitung ulang dari tabel `public_menu_items`. Harga kiriman browser tidak dipakai, dan nama item harus cocok dengan menu aktif.
- Semua field divalidasi dan dibatasi panjangnya.
- Rate limit 5 permintaan per 10 menit per IP, dan 60 per jam secara keseluruhan.
- Kalau memakai pengirim bawaan `onboarding@resend.dev`, Resend hanya mengizinkan kirim ke email pemilik akun Resend. Untuk kirim ke email lain, verifikasi domain dulu.

## Deploy ke Vercel

1. Import repo di Vercel. Framework Next.js terdeteksi otomatis.
2. Isi env Production: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.
3. Deploy, lalu pastikan domainnya sudah ada di Site URL dan Redirect URLs Supabase (langkah 5).
4. `vercel.json` mengatur header `Cache-Control` untuk `sw.js` dan `manifest.webmanifest` supaya update service worker langsung terdeteksi. Cara ini dipilih karena `headers()` di `next.config` tidak berlaku untuk `output: 'export'`.
5. Coba di HP: buka saat online, install ke layar utama, matikan jaringan, lalu reload tiap tab.

## Perintah dan tes

| Perintah                | Fungsi                                          |
| ----------------------- | ----------------------------------------------- |
| `pnpm dev`              | Dev server di port 3000                         |
| `pnpm build`            | Build produksi dan service worker               |
| `pnpm lint`             | ESLint                                          |
| `pnpm typecheck`        | `tsc --noEmit`                                  |
| `pnpm test`             | Unit test (Vitest)                              |
| `pnpm test:e2e`         | E2E Playwright di port 3002                     |
| `pnpm test:e2e:offline` | Build produksi, lalu uji semua tab saat offline |
| `pnpm format`           | Prettier                                        |

Unit test mencakup logika domain (`money`, `cart`, `stock`, `reports`, `consignment`), skema Zod, dan sync. E2E mencakup jual tunai, void, tutup hari, pre-order, titip jual, riwayat stok, lightbox menu, dan cek aksesibilitas dengan axe. E2E memakai folder build `.next-e2e` sendiri, jadi aman dijalankan waktu `pnpm dev` masih hidup.

Sebelum deploy:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm test:e2e && pnpm test:e2e:offline
```

## Struktur folder

```
src/
  app/          rute: (app)/ untuk dashboard, masuk/, POS/, privasi/
  domain/       logika murni (money, cart, stock, reports, consignment) dan tesnya
  data/         db.ts (Dexie), repositories/, sync/ (push, pull, klien Supabase)
  features/     auth, pos, stock, orders, consignment, reports, products, settings, landing
  shell/        tab bar HP, sidebar desktop, header
  ui/           komponen UI buatan sendiri
  providers/    provider aplikasi
  lib/          id (ULID), tanggal dan zona waktu
supabase/
  migrations/   001 sampai 004
  functions/    notify-preorder (Deno)
e2e/            tes Playwright
docs/           PRD, UX, arsitektur, model data, roadmap, keputusan
```

## Catatan teknis

- Uang selalu integer rupiah, tidak pernah float. Tampilan lewat `formatRupiah()`.
- Aksi kasir tidak boleh menunggu jaringan. Tulis ke Dexie dulu.
- Komponen tidak boleh mengimpor `@/data/db`. Akses data lewat `src/data/repositories/*`.
- Penjualan dan pergerakan stok tidak diedit. Koreksi dilakukan dengan void atau data pembalik.
- ID dibuat di sisi klien (ULID). Tanggal bisnis memakai zona waktu `Asia/Jakarta`.
- Pre-order dari halaman publik tidak memotong stok. Stok baru berkurang waktu penjualan dicatat di POS.
- Keputusan penting dicatat di [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Dokumen lain

Mulai dari [`docs/00-README.md`](docs/00-README.md).

- [`docs/01-PRD.md`](docs/01-PRD.md): masalah, persona, fitur, kriteria penerimaan
- [`docs/02-UX-UI.md`](docs/02-UX-UI.md): navigasi, wireframe, design token
- [`docs/03-ARCHITECTURE.md`](docs/03-ARCHITECTURE.md): stack, offline-first, sync
- [`docs/04-DATA-MODEL.md`](docs/04-DATA-MODEL.md): skema Dexie dan SQL Supabase
- [`docs/05-ROADMAP.md`](docs/05-ROADMAP.md): milestone dan checklist
- [`docs/AGENTS.md`](docs/AGENTS.md): aturan kerja untuk AI agent
- [`docs/DECISIONS.md`](docs/DECISIONS.md): catatan keputusan

## Keterbatasan

- Rate limit email hanya disimpan di memori per instance function. Cukup untuk spam biasa, belum untuk serangan serius.
- Kalau menu publik memakai daftar cadangan (Supabase tidak terjangkau), email pre-order tidak terkirim karena harga tidak bisa diverifikasi. WhatsApp tetap jalan.
- Stok tidak di-reserve, jadi dua orang bisa memesan stok terakhir yang sama. Penjual mengonfirmasi lewat WhatsApp.
- Belum dikerjakan: tes RLS antar pengguna, e2e dua perangkat, uji di HP Android dan iPhone, uji performa dengan data besar, dan backup Supabase.
- Cetak struk Bluetooth belum ada. QRIS hanya menampilkan gambar QR statis dan dikonfirmasi manual.

Belum ada file lisensi.
