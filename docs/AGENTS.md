# AGENTS.md: Aturan Kerja untuk AI Agent

Proyek: **POS Risol**, PWA offline-first untuk penjual risol. Baca `00-README.md` untuk peta dokumen.

## Cara kerja

1. Baca `05-ROADMAP.md`, kerjakan **satu milestone/tugas** pada satu waktu, berurutan.
2. Sebelum menulis kode fitur, baca bagian terkait di `01-PRD.md`, `02-UX-UI.md`, `04-DATA-MODEL.md`.
3. **Jangan menambah fitur di luar PRD.** Kalau menurutmu perlu, tulis di `docs/DECISIONS.md` sebagai usulan dan berhenti bertanya.
4. Jangan mengubah keputusan di dokumen tanpa persetujuan. Kalau ada konflik antar dokumen, prioritas: `AGENTS.md` > `04-DATA-MODEL.md` > `03-ARCHITECTURE.md` > `01-PRD.md` > `02-UX-UI.md`. Catat konfliknya.
5. Setelah selesai satu tugas: jalankan lint, typecheck, test; centang tugas di `05-ROADMAP.md`; commit dengan pesan jelas.

## Aturan keras (jangan dilanggar)

- **Uang = integer rupiah** (`number` bilangan bulat, tanpa desimal). Dilarang pakai float untuk uang. Format tampilan lewat `formatRupiah()` (`Intl.NumberFormat('id-ID')`).
- **Offline-first:** UI tidak boleh `await` jaringan untuk aksi kasir. Semua tulis ke Dexie dulu, lalu masuk `outbox`. Tidak ada spinner "menunggu server" di alur kasir.
- **Data transaksi immutable.** `sales` dan `stock_movements` hanya di-insert. Pembatalan = baris baru (void/reversal), bukan UPDATE/DELETE.
- **Stok = hasil jumlah `stock_movements`**, bukan angka yang di-overwrite. Tidak ada kolom `stock` yang diedit langsung.
- **ID dibuat di klien** (ULID/UUID v7), supaya bisa dibuat saat offline dan tidak bentrok saat sync.
- **Waktu disimpan UTC (ISO 8601)**, ditampilkan di zona waktu perangkat. "Hari" laporan dihitung dengan zona waktu `Asia/Jakarta` secara default (bisa diatur di Pengaturan).
- Semua logika bisnis (hitung total, kembalian, stok, laba, setoran) ada di `src/domain/` sebagai fungsi murni tanpa import React/Dexie, dan wajib ada unit test.
- **Bahasa UI: Bahasa Indonesia**, nada ramah dan singkat. Kode, nama variabel, nama tabel: Inggris.

## Stack & perintah

- Next.js (App Router) + React + TypeScript strict, Tailwind, Dexie, Zod, Vitest, Playwright, Serwist (PWA), `@supabase/supabase-js`. Deploy: Vercel. Backend: Supabase.
- Package manager: `pnpm`.
- **Next.js dipakai sebagai app client-only** (`output: 'export'`). Baca `03-ARCHITECTURE.md` bagian 1a sebelum menulis kode. Ringkasnya: semua halaman fitur `'use client'`; dilarang Server Component untuk data, Route Handler, Server Action, middleware, dan rute dinamis `[id]` (pakai query string); jangan pasang React Router.

```
pnpm dev          # dev server
pnpm lint         # eslint
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest (unit)
pnpm e2e          # playwright
pnpm build        # produksi + PWA
```

## Konvensi kode

- TypeScript `strict: true`, tanpa `any` kecuali dikomentari alasannya.
- Komponen fungsi, satu komponen per file, nama file `PascalCase.tsx`; util `camelCase.ts`.
- Validasi input form dan data masuk dari server dengan Zod; tipe diturunkan dari skema (`z.infer`).
- Akses Dexie hanya lewat `src/data/repositories/*`; komponen tidak memanggil `db` langsung.
- Tidak ada state global untuk data persisten. Baca data lewat `useLiveQuery` (Dexie). Zustand hanya untuk state UI sementara (keranjang aktif).
- Tidak ada library UI besar. Pakai Tailwind + komponen sendiri di `src/ui/`.

## UI wajib

- Target sentuh minimal **48x48 px** untuk semua tombol di alur kasir.
- Kontras teks minimal WCAG AA.
- Semua aksi utama kasir terjangkau satu tangan (zona jempol, tombol utama di bawah) di layar HP.
- Ada indikator status sinkron dan banner offline yang tidak mengganggu.
- Setiap layar punya state: loading (skeleton), kosong (empty state dengan ajakan aksi), error (pesan manusiawi + cara coba lagi).

## Definition of Done (per tugas)

- [ ] Sesuai acceptance criteria di PRD.
- [ ] UI mengikuti wireframe dan token di `02-UX-UI.md`.
- [ ] Logika domain punya unit test; alur kritis punya e2e (lihat roadmap).
- [ ] Jalan penuh dengan jaringan dimatikan (cek manual atau Playwright `context.setOffline(true)`).
- [ ] `pnpm lint && pnpm typecheck && pnpm test` hijau.
- [ ] Checklist roadmap dicentang, perubahan penting dicatat di `docs/DECISIONS.md`.

## Hal yang harus ditanyakan ke manusia, jangan ditebak

- Perubahan skema data setelah M1 (butuh migrasi Dexie + SQL).
- Menambah dependency baru yang besar.
- Apa pun yang menyentuh uang pelanggan (payment gateway, rekening, dll.).
