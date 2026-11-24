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
- **Ikon PWA** saat ini placeholder 1×1 px (`public/icon-192.png`, `icon-512.png`) dan perlu diganti aset final.
- **Superadmin/multi-user** tidak diimplementasikan (di luar MVP).

## Status implementasi (per milestone)

- M0: sebagian. Next.js/Tailwind/ESLint/Vitest/pnpm, shell, token, PWA, CI (`.github/workflows/ci.yml`). Belum: Prettier, Playwright, koneksi Vercel, spike offline manual.
- M1: selesai (kecuali unit test khusus validasi bundle).
- M2: selesai fungsional; E2E Playwright belum.
- M3: selesai fungsional; E2E belum.
- M4: selesai (laporan, CSV, backup JSON).
- M5: migrasi SQL + RLS tersedia; sync engine (push/pull/dead-letter) tersedia. Belum: login Supabase, layar antrean sinkronisasi, tes RLS/sync, E2E dua perangkat. Butuh env `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`; tanpa itu aplikasi berjalan lokal.
- M6: selesai fungsional termasuk kebutuhan produksi per tanggal dan tombol WA; E2E belum.
- M7: selesai fungsional termasuk integrasi laporan; E2E belum.
- M8: PIN, Wake Lock, tema gelap, `storage.persist()` selesai. Belum: audit axe, uji perangkat, seed performa, log error + "Salin log", halaman panduan, deploy produksi.
