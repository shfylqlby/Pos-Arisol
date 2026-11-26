# 05. Roadmap dan Checklist

Kerjakan berurutan. Satu milestone = satu cabang/PR. Centang `[x]` setelah Definition of Done di `AGENTS.md` terpenuhi.

## M0. Fondasi proyek

- [x] Inisialisasi Next.js (App Router, TS strict) dengan `output: 'export'`, Tailwind, ESLint, Prettier, Vitest, Playwright, pnpm. Ikuti `03-ARCHITECTURE.md` bagian 1a.
- [ ] Hubungkan repo ke Vercel (preview deploy per PR), set env `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` (isi nanti di M5).
- [x] Struktur folder sesuai `03-ARCHITECTURE.md` bagian 2.
- [x] Token desain (CSS variables terang/gelap) dan font self-host.
- [x] Shell aplikasi: router, tab bar HP, sidebar desktop, header dengan chip sync (statis dulu).
- [x] PWA dasar dengan Serwist: manifest, service worker, ikon, bisa di-install.
- [ ] **Spike offline wajib:** deploy ke Vercel preview, buka online, matikan jaringan, reload di semua rute tab. Harus tetap tampil. Jika gagal, selesaikan sebelum lanjut ke M1.
- [x] CI: lint, typecheck, test.
- **Selesai jika:** app bisa dibuka, di-install, navigasi 5 tab jalan, CI hijau.

## M1. Data lokal + Produk

- [x] `db.ts` skema versi 1 (semua tabel, termasuk `outbox`, `sync_state`).
- [x] `schemas.ts` (Zod) dan repository dasar yang **menulis outbox dalam transaksi yang sama**.
- [x] `lib/id` (ULID), `lib/date` (business_date per zona waktu), `domain/money`.
- [x] Onboarding (nama usaha + 3 produk template).
- [x] CRUD Produk (single dan bundle), urutan, aktif/nonaktif, kalkulator modal.
- [ ] Unit test `money`, validasi produk (bundle wajib `base_product_id`).
- **Selesai jika:** produk bisa dibuat/ubah/urut, data bertahan setelah reload dan saat offline.

## M2. Kasir + Pembayaran + Struk

- [x] `domain/cart` + test (paket, diskon, total).
- [x] Layar Kasir HP + dua panel desktop, grid produk, kategori, keranjang sheet.
- [x] Layar Bayar: tunai (uang cepat dinamis, keypad), QRIS (gambar dari Pengaturan), transfer.
- [x] `createSale()` atomik: `sales` + `sale_items` + `stock_movements(sale)` + outbox dalam **satu transaksi Dexie**; nomor struk per perangkat.
- [x] Layar Sukses, auto-kembali, struk (teks WA, print 58 mm, PNG via share).
- [x] Daftar transaksi + detail + Void (reversal).
- [x] E2E: jual tunai dengan `setOffline(true)`; void mengembalikan stok.
- **Selesai jika:** transaksi tunai umum ≤ 3 ketukan, jalan offline, stok terpotong dan terkembalikan benar.

## M3. Stok & Produksi

- [x] `domain/stock` + test (ledger, waste, adjustment).
- [x] Layar Stok Hari ini, Produksi (input cepat), Riwayat.
- [x] Wizard Tutup hari (sisa fisik → waste/adjustment, ringkasan).
- [x] Peringatan hampir habis/habis di Kasir dan Stok.
- [x] E2E: produksi → jual → tutup hari, angka stok konsisten.
- **Selesai jika:** stok = jumlah ledger di semua layar; tidak ada edit stok langsung.
- **Gerbang validasi:** coba dengan 1-2 penjual nyata sebelum lanjut (lihat asumsi di PRD bagian 6).

## M4. Laporan

- [x] `domain/reports` + test (snapshot modal, void dikecualikan, periode, zona waktu).
- [x] Layar Laporan: filter periode, 6 kartu, terlaris, metode bayar, grafik, daftar transaksi.
- [x] Ekspor CSV (transaksi dan ringkasan).
- [x] Backup/impor JSON (Pengaturan).
- **Selesai jika:** angka laporan cocok dengan perhitungan manual pada data uji; CSV terbuka benar di Excel/Sheets.

## M5. Akun + Sync

- [x] Supabase project, migrasi SQL + RLS dari `04-DATA-MODEL.md`, trigger `server_updated_at` dan guard LWW.
- [x] Login magic link + initial upload data lokal (otomatis saat masuk).
- [x] Login Google (OAuth) di layar Sinkronisasi (butuh provider Google aktif di Supabase).
- [x] Halaman `/masuk` (email + sandi, Google, magic link) dan `AuthGate` yang mengalihkan pengunjung tanpa sesi; pendaftaran publik dinonaktifkan, akun dibuat manual oleh pemilik.
- [x] Sync engine: push outbox (idempoten, retry, backoff), pull inkremental per tabel, dead-letter.
- [x] `SyncBadge`, layar Pengaturan → Sinkronisasi (antrean, error, coba lagi).
- [x] Tes sync mock: push sukses, dead-letter fatal, error sementara, exception jaringan.
- [ ] Tes RLS (pengguna A tidak bisa baca data B).
- [ ] E2E: transaksi offline → online → muncul di perangkat kedua (konteks browser kedua).
- **Selesai jika:** 0 data hilang pada skenario offline→online dan dua perangkat; LWW sesuai aturan.

## M6. Pre-order

- [x] Form, list, detail, status, kebutuhan produksi per tanggal.
- [x] Selesaikan pesanan → membuat sale (sisa bayar), stok terpotong saat `done`.
- [x] Tombol kirim WA (template teks).
- [x] E2E: pesanan dengan DP sampai selesai.

## M7. Titip jual (sederhana)

- [x] Mitra, harga setoran, Kirim (drop), Setoran (terjual/retur), tandai lunas.
- [x] `domain/consignment` + test (tagihan, sisa di mitra).
- [x] Integrasi laporan (omzet titip jual terpisah, bisa digabung).
- [x] E2E: drop → setoran → lunas, stok dan laporan benar.

## M8. Pengerasan dan rilis pilot

- [x] PIN lokal, Wake Lock, tema gelap, `storage.persist()`.
- [x] Audit aksesibilitas otomatis (`axe`) di 5 tab utama.
- [ ] Uji di HP Android kelas menengah dan iPhone, layar kecil 360 px.
- [ ] Kinerja: buka < 2 detik, ketuk produk < 100 ms dengan 100 produk dan 10.000 transaksi (seed uji).
- [x] Log error lokal + "Salin log".
- [x] Halaman "Panduan singkat" dan data contoh.
- [ ] Deploy produksi ke Vercel (domain, env produksi), aktifkan backup Supabase, pastikan header cache `sw.js`.
- **Selesai jika:** pilot 3-5 penjual berjalan 2 minggu; metrik di PRD bagian 5 diukur.

## Setelah MVP (jangan dikerjakan sebelum diminta)

Cetak Bluetooth ESC/POS, sync foto/QRIS ke Storage, bahan baku dan resep, diskon persen, multi-pengguna, QRIS dinamis, ekspor PDF.

## Catatan keputusan (`docs/DECISIONS.md`) — isi awal

1. Next.js dipakai client-only (`output: 'export'`) + PWA via Serwist, deploy Vercel, backend Supabase (keputusan pemilik produk; Vite dipertimbangkan lalu tidak dipilih).
2. Dexie lokal sebagai sumber kebenaran, Supabase sebagai replika/sinkron.
3. Stok = ledger append-only; transaksi immutable; void = reversal.
4. HPP = modal manual per produk, di-snapshot ke `sale_items`.
5. Pre-order dihitung ke omzet saat `done`.
6. Titip jual MVP = satu mitra per setoran, tanpa akun mitra.
