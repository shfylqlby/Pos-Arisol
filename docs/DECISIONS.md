# DECISIONS

Catatan keputusan teknis dan status implementasi. Konflik antar dokumen mengikuti urutan prioritas di `AGENTS.md`.

## Keputusan produk/arsitektur

1. Next.js client-only (`output: 'export'`) + PWA Serwist, deploy Vercel, backend Supabase (Vite dipertimbangkan, tidak dipilih).
2. Dexie lokal = sumber kebenaran; Supabase = replika/sinkron.
3. Stok = ledger append-only; transaksi immutable; void = reversal (baris baru).
4. HPP = modal manual per produk, di-snapshot ke `sale_items`.
5. Pre-order dihitung ke omzet saat `done`.
6. Titip jual MVP = satu mitra per setoran, tanpa akun mitra.

## Keputusan implementasi

- **Onboarding** memakai penanda `localStorage` (`pos-onboarded`) alih-alih kolom baru di `settings`, agar skema Dexie v1 tidak berubah.
- **Tema** disimpan di `localStorage` (`pos-theme`), diterapkan lewat kelas `.dark` di `<html>`.
- **PIN** disimpan sebagai hash SHA-256 (`pos-risol:<pin>`) di `settings.pin_hash`; tidak ikut dikirim ke outbox. PIN hanya mengunci tab Lainnya.
- **Nomor struk** = `{device_label}-{urut 4 digit}` per hari bisnis.
- **Struk** memakai teks untuk WhatsApp, `window.print()` dengan CSS 58 mm, dan PNG via `navigator.share`/unduh.
- **Laporan titip jual** dihitung dari setoran berstatus `paid` pada periode (tanggal `paid_at` menurut zona waktu pengaturan), ditampilkan terpisah dan digabung.
- **Semua akses Dexie** lewat `src/data/repositories/*`; komponen memakai `useLiveQuery` ke fungsi repository.
- **Backup** mengekspor/mengimpor 14 tabel data (tanpa `outbox`/`sync_state`); impor mengganti seluruh data lalu memuat ulang halaman.
- **Ikon PWA** dibuat generatif (risol di latar oranye) untuk 192/512 + maskable 512; bisa diganti aset final kapan saja.
- **Pembacaan useLiveQuery tidak boleh menulis**: getSettings() read-only, penulisan awal lewat ensureSettings() di Providers; pelanggaran ini memicu Dexie ReadOnlyError dan loop error boundary.
- **Overlay layar penuh** (Bayar/Sukses) memakai z-50 di atas TabBar (z-40).
- **Next.js** dikunci di 14.2.35 (patch keamanan); ESLint config mengikuti versi yang sama.
- **Format** Prettier + prettier-plugin-tailwindcss; **E2E** Playwright (Pixel 5, locale id-ID, timezone Asia/Jakarta) dengan webServer pnpm dev.
- **Offline produksi** diuji terpisah via `pnpm test:e2e:offline`: build export disajikan `scripts/serve-out.mjs` (port 3100), lalu 5 tab di-reload saat offline. Kasir memakai heading `sr-only` agar punya landmark h1; audit `axe` dijalankan di 5 tab.
- **Superadmin/multi-user** tidak diimplementasikan (di luar MVP).
- **Pemisahan rute publik dan aplikasi**: `/` = beranda Arisol (info produk + pre-order via WhatsApp), `/POS` = halaman produk POS, `/masuk` = login, dan dashboard di grup `(app)` (`/kasir`, `/stok`, `/pesanan`, `/laporan`, `/lainnya`). `AuthGate` hanya membungkus grup `(app)` sehingga halaman publik tetap ringan.
- **Akun dibuat manual**: pendaftaran publik dinonaktifkan di Supabase; pemilik membuat akun lewat dashboard. Login tersedia lewat email + sandi, Google, dan magic link. Tanpa env Supabase (atau dengan `NEXT_PUBLIC_LOCAL_MODE=1`) aplikasi berjalan mode lokal tanpa login.
- **Logo asli** `public/logo.png` dipakai lewat komponen `src/ui/Logo.tsx`; ikon PWA (`icon-192`, `icon-512`, `icon-maskable-512`, `apple-touch-icon`) diturunkan dari logo tersebut.
- **Isolasi E2E**: dev test memakai port 3002, `NEXT_DIST_DIR=.next-e2e`, dan `NEXT_PUBLIC_LOCAL_MODE=1` agar tidak bentrok dengan dev server/`.next`; test offline menyajikan folder `.next-e2e` lewat `STATIC_DIR`.
- **Form pre-order tanpa backend**: karena situs statis (`output: 'export'`), form di `/` hanya menyusun ringkasan pesanan lalu membuka WhatsApp. Tidak ada data pelanggan yang disimpan di server dari form publik. Daftar menu dan harga ada di `src/features/landing/menu-data.ts`; poster asli ada di `public/menu-harga-arisol/`.
- **Peta & SEO landing**: peta memakai embed koordinat Toko Arisol (`-7.0786873,110.4146975`) dan tautan `maps.app.goo.gl`; metadata Open Graph/Twitter, `sitemap.xml`, dan `robots.txt` memakai `NEXT_PUBLIC_SITE_URL` (fallback `http://localhost:3000`).
- **Reset kata sandi**: `/masuk` mengirim tautan `resetPasswordForEmail` ke `/masuk/reset`; halaman itu memakai sesi recovery Supabase untuk `updateUser({ password })`. URL `/masuk/reset` harus ditambahkan ke Redirect URLs di Supabase Auth.
- **Menu publik dinamis**: menu, foto, dan harga di `/` dibaca dari `public_menu_items` (Supabase) lewat `src/data/public-menu.ts`, bukan dari data statis. POS punya halaman **Lainnya → Menu publik** untuk CRUD, upload foto ke bucket `menu`, dan menyembunyikan item. Halaman publik memakai fallback `menu-data.ts` bila cloud/migrasi belum ada. RLS: semua orang boleh membaca, hanya pengguna login yang boleh menulis.
- **Stok menu publik**: `public_menu_items.product_id` menghubungkan menu ke produk POS; view `public_menu_with_stock` (migrasi 004) membuka hanya stok agregat ke publik. Form pre-order membatasi jumlah sesuai stok; menu tanpa produk terhubung = stok bebas. Pre-order publik belum mereservasi stok; stok berkurang saat penjualan dicatat di POS.
\r
- **Hardening email pre-order**: Edge Function tidak mempercayai klien. Harga dihitung ulang dari public_menu_items (nama harus menu aktif), semua field dibatasi panjangnya, rate limit di memori (5/10 menit per IP, 60/jam global), CORS bisa dibatasi lewat ALLOWED_ORIGIN. Rate limit per isolate itu cukup untuk spam kasual; naik ke tabel Postgres bila diserang serius. Menu fallback (tanpa DB) tidak terverifikasi, jadi email tidak terkirim; WhatsApp tetap jalan.
- **Lightbox**: memakai entri history sendiri supaya tombol Back HP menutup foto, bukan keluar halaman; fokus dikunci dan dikembalikan ke pemicu.
- **/POS noindex**: halaman pemasaran POS tidak diindeks (meta robots + disallow + keluar dari sitemap).
- **Dexie v2**: index `created_at` pada `stock_movements` untuk Riwayat stok.
- **Halaman pendukung publik**: `/privasi`, `not-found.tsx`, dan `error.tsx` ditambahkan agar tautan footer, 404, dan error tidak jatuh ke halaman kosong.

## Status implementasi (per milestone)

- M0: sebagian. Next.js/Tailwind/ESLint/Vitest/pnpm, shell, token, PWA, CI (`.github/workflows/ci.yml`). Prettier dan Playwright sudah terpasang. Spike offline tervalidasi lokal via `pnpm test:e2e:offline` (build produksi + service worker, reload 5 tab saat offline). Belum: koneksi Vercel.
- M1: selesai.
- M2: selesai termasuk E2E (jual tunai offline, void mengembalikan stok).
- M3: selesai termasuk E2E (produksi → jual → tutup hari).
- M4: selesai (laporan, CSV, backup JSON).
- M5: migrasi SQL + RLS tersedia; sync engine (push/pull/dead-letter), login magic link + Google, halaman `/masuk` dengan email + sandi, reset kata sandi (`/masuk/reset`), `AuthGate`, initial upload otomatis, dan layar Sinkronisasi (antrean, error, coba lagi) selesai. Pull melewati baris yang masih punya outbox pending agar tidak menimpa perubahan lokal. Tes sync mock (push) lulus memakai `fake-indexeddb`. Belum: tes RLS, E2E dua perangkat, provider Google di Supabase. Butuh env `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`; tanpa itu aplikasi berjalan lokal.
- M6: selesai fungsional termasuk kebutuhan produksi per tanggal dan tombol WA; E2E selesai (DP → selesai).
- M7: selesai fungsional termasuk integrasi laporan; E2E selesai (drop → setoran → lunas).
- M8: PIN, Wake Lock, tema gelap, `storage.persist()`, log error + "Salin log", halaman Panduan, dan ikon PWA selesai. Audit `axe` otomatis di 5 tab utama lulus (tanpa pelanggaran serious/critical). Belum: uji perangkat fisik, seed performa, deploy produksi.
