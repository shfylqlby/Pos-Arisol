# POS Risol: Paket Dokumentasi

Aplikasi kasir (POS) berbasis web/PWA untuk penjual risol skala lapak/gerobak (1 orang). Bisa dipakai di HP dan laptop/PC, tetap jalan tanpa internet.

## Urutan baca (wajib untuk AI agent)

| #   | File                 | Isi                                             | Kapan dibaca                            |
| --- | -------------------- | ----------------------------------------------- | --------------------------------------- |
| 0   | `AGENTS.md`          | Aturan kerja, konvensi kode, definition of done | Selalu, di awal setiap sesi             |
| 1   | `01-PRD.md`          | Masalah, persona, fitur, acceptance criteria    | Sebelum mengerjakan fitur apa pun       |
| 2   | `02-UX-UI.md`        | Navigasi, wireframe tiap layar, design token    | Sebelum membuat UI                      |
| 3   | `03-ARCHITECTURE.md` | Stack, struktur folder, offline-first, sync     | Sebelum menulis kode pertama            |
| 4   | `04-DATA-MODEL.md`   | Skema Dexie + SQL Supabase + aturan domain      | Sebelum menyentuh data                  |
| 5   | `05-ROADMAP.md`      | Milestone M0-M8 dengan checklist                | Untuk tahu apa yang dikerjakan sekarang |

## Ringkasan keputusan

- **Pengguna:** 1 pemilik lapak/gerobak risol, bukan tim. Tidak ada multi-role di MVP.
- **Perangkat:** HP (utama) dan laptop/PC (laporan, input produk). Mobile-first, layout desktop dua panel.
- **Koneksi:** Offline-first. Semua tulis ke IndexedDB dulu, sync ke cloud di belakang layar.
- **Fitur MVP:** Kasir cepat + struk, stok & produksi harian, laporan penjualan & laba, pre-order & titip jual.
- **Stack:** Next.js (App Router, dipakai client-only dengan `output: 'export'`) + React + TypeScript + Tailwind + Dexie, backend Supabase (auth + Postgres), deploy di Vercel. Aturan khusus Next.js untuk offline-first ada di `03-ARCHITECTURE.md` bagian 1a.

## Peta rute

| Rute      | Isi                                                         | Akses              |
| --------- | ----------------------------------------------------------- | ------------------ |
| `/`       | Beranda Arisol: menu & harga, form pre-order, FAQ, peta     | Publik             |
| `/POS`    | Halaman produk POS, CTA masuk ke dashboard                  | Publik             |
| `/privasi`| Kebijakan privasi                                           | Publik             |
| `/masuk`  | Login (email + sandi, Google, magic link, lupa sandi)       | Publik             |
| `/masuk/reset` | Atur ulang kata sandi dari tautan email                | Publik             |
| `/kasir`  | Aplikasi kasir (tab Kasir)                                  | Butuh sesi         |
| `/stok`, `/pesanan`, `/laporan`, `/lainnya` | Tab dashboard lainnya                     | Butuh sesi         |
| `/lainnya/menu` | Atur menu publik, foto, dan harga untuk halaman Arisol | Butuh sesi |

Akun dibuat manual oleh pemilik (pendaftaran publik dinonaktifkan). Tanpa env Supabase, aplikasi berjalan mode lokal dan langsung masuk ke `/kasir`. Form pre-order mengirim ringkasan pesanan ke WhatsApp, bukan menyimpan data di server.

## Menu publik

Menu, foto, dan harga di `/` dibaca dari tabel `public_menu_items` di Supabase (bukan hardcode). Pemilik mengaturnya di POS: **Lainnya → Menu publik**. Jalankan `supabase/migrations/003_public_menu.sql` sekali di Supabase SQL Editor untuk membuat tabel, bucket foto `menu`, RLS, dan menu awal. Tanpa migrasi/tanpa cloud, halaman memakai daftar contoh di `src/features/landing/menu-data.ts`.

## Keputusan yang sengaja dipersempit (hasil tantangan scope)

1. **Titip jual** (konsinyasi ke warung) adalah model reseller, bukan lapak 1 orang. Tetap masuk MVP sesuai permintaan, tapi dibangun terakhir (M7) dalam versi sederhana: satu mitra, satu setoran per periode, tanpa akun mitra.
2. **HPP** dihitung per produk dengan input manual (modal per pcs), bukan resep/BOM bahan baku. Bahan baku baru dipertimbangkan setelah MVP dipakai nyata.
3. **Pembayaran QRIS** hanya menampilkan gambar QR statis milik penjual dan konfirmasi manual. Tidak ada payment gateway di MVP.
4. **Cetak struk Bluetooth** bukan syarat MVP (Web Bluetooth tidak jalan di iOS). Struk dibagikan lewat WhatsApp/gambar dan cetak browser.

## Asumsi yang belum teruji (validasi dengan 1-2 penjual asli sebelum M3)

- Penjual benar-benar mau mencatat sisa stok harian, bukan hanya penjualan.
- Penjual jualan risol matang/goreng-di-tempat dan frozen sekaligus. Kalau tidak, model stok disederhanakan.
- HP yang dipakai Android. Kalau banyak iPhone, fitur PWA install dan notifikasi perlu dicek ulang.

## Stok publik & email pre-order

Jalankan `supabase/migrations/004_public_menu_stock.sql`, lalu di POS: **Lainnya → Menu publik → pilih "Produk stok"** per menu. Email pemilik saat ada pre-order: deploy `supabase/functions/notify-preorder` dan set secret `RESEND_API_KEY` + `PREORDER_NOTIFY_EMAIL` (lihat `.env.example`).
