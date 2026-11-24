# 02. UX/UI

## 1. Prinsip desain

1. **Satu tangan, satu ketukan.** Aksi kasir ada di zona jempol (separuh bawah layar HP).
2. **Besar dan jelas.** Tombol ≥ 48 px, angka uang besar dan tebal. Tangan berminyak, layar kena cahaya matahari.
3. **Tidak pernah menunggu jaringan.** Tidak ada spinner di alur kasir. Status sync kecil dan tenang.
4. **Sedikit ketikan.** Pakai tombol cepat, default pintar, ingat pilihan terakhir.
5. **Salah itu wajar.** Setiap aksi destruktif bisa dibatalkan (undo toast 5 detik) atau butuh konfirmasi satu langkah.
6. **Bahasa warung.** Singkat dan hangat: "Habis", "Kembalian", "Tutup hari". Hindari istilah akuntansi di UI ("Omzet" dan "Untung" boleh; "HPP" tampil sebagai "Modal").

## 2. Navigasi (Information Architecture)

```
Kasir (default)
Stok            -> Hari ini | Produksi | Riwayat
Pesanan         -> Pre-order | Titip jual
Laporan
Lainnya         -> Produk, Pengaturan, Backup, Keluar
```

- **HP (< 768 px):** bottom tab bar 5 item: Kasir, Stok, Pesanan, Laporan, Lainnya. Ikon + label. Tab Kasir aktif saat buka app.
- **Laptop/PC (≥ 1024 px):** sidebar kiri ikon + label. Halaman Kasir memakai **layout dua panel**: grid produk di kiri (± 65%), keranjang permanen di kanan.
- **Tablet (768-1023 px):** sidebar ikon saja, Kasir dua panel.

Header tipis: nama usaha, tanggal hari ini, chip status sync (lihat bagian 6).

## 3. Layar dan wireframe

### 3.1 Kasir (HP)

```
┌──────────────────────────────┐
│ Risol Bu Sari   ● Tersimpan  │  header + status sync
├──────────────────────────────┤
│ [Semua][Risol][Paket][Minum] │  chip kategori (scroll horizontal)
├──────────────────────────────┤
│ ┌────────┐ ┌────────┐        │
│ │Risol   │ │Risol   │        │  kartu produk 2 kolom
│ │Mayo    │ │Ragout  │        │  nama, harga, sisa stok
│ │Rp3.000 │ │Rp3.000 │        │  badge qty di keranjang
│ │sisa 24 │ │sisa 3 ⚠│  (2)   │
│ └────────┘ └────────┘        │
│ ┌────────┐ ┌────────┐        │
│ │Paket 5 │ │Habis   │        │
│ └────────┘ └────────┘        │
├──────────────────────────────┤
│ 3 item            Rp 9.000 ▲ │  bar keranjang (ketuk = buka sheet)
│ [        BAYAR  Rp 9.000   ] │  tombol utama, lebar penuh, 56px
├──────────────────────────────┤
│ Kasir  Stok  Pesanan Lap. ⋯  │
└──────────────────────────────┘
```

- Ketuk kartu: +1 dengan animasi singkat dan getar ringan (`navigator.vibrate(10)` jika ada).
- Ketuk bar keranjang: bottom sheet berisi daftar item dengan stepper − qty +, hapus, kosongkan, kolom diskon.
- Produk habis: label "Habis" kontras tinggi tapi tetap bisa diketuk (ada toast "Stok 0, tetap dijual?" hanya sekali per produk per sesi).
- Pencarian (ikon kaca pembesar) hanya muncul jika produk > 12.

**Desktop:** panel kanan = keranjang permanen (daftar, total, tombol Bayar). Shortcut: `1-9` pilih produk ke-n, `Enter` Bayar, `Esc` batal, `/` fokus cari.

### 3.2 Bayar

Layar penuh (HP) atau modal (desktop).

```
┌──────────────────────────────┐
│ ←  Bayar                     │
│        Total                 │
│      Rp 9.000                │  angka 40px bold
│ [ Tunai ][ QRIS ][ Transfer ]│  segmented, tunai default
│                              │
│ [ UANG PAS ]                 │  tombol lebar, primary
│ [5.000][10.000][20.000]      │  grid tombol uang cepat
│ [50.000][100.000][Lainnya…]  │  "Lainnya" buka keypad angka
│                              │
│ Diterima   Rp 10.000         │
│ Kembalian  Rp 1.000          │  hijau, besar
│ [        SELESAI           ] │  aktif jika diterima ≥ total
└──────────────────────────────┘
```

- Tombol uang cepat dibuat dinamis: pecahan terdekat di atas total (contoh total 9.000 → 10.000, 20.000, 50.000).
- QRIS: tampilkan gambar QR penjual layar penuh, kecerahan tidak diubah. Tombol "Sudah dibayar" dan "Ganti metode".
- Jika gambar QRIS belum diatur: empty state dengan tombol "Atur QRIS" ke Pengaturan.

### 3.3 Sukses

```
        ✓  Transaksi tersimpan
        Kembalian
        Rp 1.000                 (besar, hijau)
        Struk A-0012
  [ Bagikan struk ]  [ Cetak ]
  [        TRANSAKSI BARU      ]  (fokus otomatis)
```

Auto-kembali ke Kasir setelah 8 detik jika tidak ada interaksi (bisa dimatikan di Pengaturan).

### 3.4 Stok

Tab: **Hari ini | Produksi | Riwayat**.

- **Hari ini:** daftar produk dengan stok sekarang (besar), mini-info "Produksi 40 · Terjual 28". Warna tepi kiri: hijau (aman), kuning (≤ ambang), merah (0). Tombol utama melayang "**Tutup hari**".
- **Produksi:** form cepat: pilih produk, stepper qty (+5, +10 cepat), simpan. Daftar produksi hari ini, bisa dihapus lewat reversal (undo).
- **Tutup hari (wizard 2 langkah):** (1) input sisa fisik per produk, default terisi stok sistem, (2) ringkasan selisih/waste, alasan opsional (Basi, Rusak, Dimakan sendiri, Lainnya), konfirmasi. Setelah itu tampilkan ringkasan hari (omzet, laba) dan tombol "Bagikan ringkasan".
- **Riwayat:** ledger per produk, filter tipe.

### 3.5 Pesanan

Dua segmen: **Pre-order | Titip jual**.

**Pre-order list:** kartu per pesanan: nama, tanggal-jam ambil, ringkasan item, total, sisa bayar, chip status berwarna. Pengelompokan: Hari ini, Besok, Mendatang, Selesai. Tombol "+ Pesanan baru" melayang. Tombol "Kebutuhan produksi" menampilkan total qty per produk untuk tanggal pilihan.

**Pre-order form:** nama, WA (keypad angka), tanggal-jam ambil (picker native), item (picker produk + stepper), DP, catatan. Total otomatis.

**Detail pesanan:** timeline status, tombol aksi tunggal sesuai status ("Mulai produksi", "Tandai siap", "Selesaikan & bayar"), "Kirim WA".

**Titip jual:** daftar mitra dengan "Sisa di mitra" dan "Tagihan belum dibayar". Detail mitra: tab Kirim | Setoran | Harga. Wizard setoran: tampilkan per produk (dikirim, sisa di mitra sebelumnya), input terjual dan retur, hitung tagihan otomatis, simpan, tombol "Tandai lunas".

### 3.6 Laporan

- Segmented filter periode di atas (Hari ini default).
- Kartu 2×3: **Omzet, Modal, Untung, Transaksi, Rata-rata, Waste**. Untung = Omzet − Modal.
- Grafik batang omzet (hanya jika ≥ 7 hari), menu terlaris (top 5, bar horizontal), pembagian metode bayar.
- Daftar transaksi (infinite list), ketuk untuk detail + Void.
- Tombol ekspor CSV di header.
- Desktop: kartu dan grafik dalam grid 3 kolom.

### 3.7 Produk (Lainnya → Produk)

Daftar dengan drag-handle urutan. Form: nama, kategori, harga jual, modal per pcs, `unit_qty` (1 = satuan; 5 = paket isi 5, wajib pilih produk dasar), ambang stok, foto, aktif. Kalkulator bantu modal: "Modal batch Rp ___ ÷ jadi ___ pcs = Rp ___/pcs".

### 3.8 Pengaturan

Info usaha (struk), gambar QRIS, zona waktu, PIN, auto-kembali kasir, tema (terang/gelap/ikuti sistem), akun dan sync, Backup (ekspor/impor JSON), "Tentang" (versi).

### 3.9 Onboarding (pertama kali buka, ≤ 60 detik)

1. Nama usaha. 2. Tambah 3 produk pertama (template risol: Mayo, Ragout, Sayur; harga bisa diubah). 3. Anjuran "Tambah ke Layar Utama" (Android: tombol install; iOS: petunjuk Share → Add to Home Screen). 4. Selesai → Kasir. Login dilewati, ditawarkan nanti (banner di Pengaturan).

## 4. Design tokens

**Warna** (semua pasangan teks/latar sudah AA):

| Token | Terang | Gelap | Pakai untuk |
|---|---|---|---|
| `--bg` | `#FFFBF5` | `#161210` | Latar halaman |
| `--surface` | `#FFFFFF` | `#201A17` | Kartu |
| `--ink` | `#1F1A17` | `#F5EFE9` | Teks utama |
| `--ink-muted` | `#6B5E55` | `#B7A99F` | Teks sekunder |
| `--primary` | `#C2410C` | `#FB923C` | Tombol utama, aksen |
| `--on-primary` | `#FFFFFF` | `#1F1A17` | Teks di atas primary |
| `--primary-soft` | `#FFEDD5` | `#3A2418` | Chip, badge qty |
| `--success` | `#15803D` | `#4ADE80` | Kembalian, aman |
| `--warning` | `#B45309` | `#FBBF24` | Hampir habis |
| `--danger` | `#B91C1C` | `#F87171` | Habis, void, hapus |
| `--border` | `#E8DED4` | `#3A312B` | Garis |

**Tipografi:** `Plus Jakarta Sans` (self-host lewat `@fontsource` supaya jalan offline), fallback `system-ui`. Skala: 12 / 14 / 16 (dasar) / 20 / 24 / 32 / 40. Angka uang: `font-variant-numeric: tabular-nums`, bobot 700.

**Spasi:** kelipatan 4 px (4, 8, 12, 16, 24, 32). **Radius:** kartu 16 px, tombol 12 px, chip penuh. **Bayangan:** hanya untuk elemen melayang (sheet, FAB). **Gerak:** 120-200 ms, hormati `prefers-reduced-motion`.

## 5. Komponen inti (di `src/ui/`)

`Button` (primary/secondary/danger/ghost, ukuran md=48 lg=56), `ProductTile`, `Stepper`, `MoneyText`, `MoneyKeypad`, `QuickCashGrid`, `BottomSheet`, `Modal`, `Segmented`, `Chip`, `StatCard`, `EmptyState`, `Toast` (dengan Undo), `ConfirmDialog`, `SyncBadge`, `OfflineBanner`, `Field`/`TextInput`/`NumberInput`.

## 6. Status offline dan sync

Chip di header:
- `● Tersimpan` (hijau): semua sudah tersinkron atau belum login (mode lokal, tulis "Tersimpan di HP ini").
- `↻ Menyinkron… (n)` (netral): ada n item di outbox dan online.
- `○ Offline · n belum terkirim` (kuning): offline dengan antrean.
- `! Gagal sync` (merah): ketuk untuk lihat penyebab dan "Coba lagi".

Banner offline hanya muncul saat perubahan status (toast singkat "Offline, tetap bisa jualan"), bukan banner permanen.

## 7. State kosong, error, dan salinan teks (contoh)

- Kasir tanpa produk: "Belum ada menu. Tambah menu pertamamu." [Tambah menu]
- Stok habis saat jual: "Stok Risol Ragout 0. Tetap dijual?"
- Void: "Batalkan transaksi A-0012? Stok akan dikembalikan." alasan wajib dipilih.
- Gagal sync: "Belum bisa kirim ke server. Datamu aman di HP ini."
- Tutup hari selisih besar (> 30% stok): "Selisihnya cukup banyak (12 pcs). Yakin angkanya benar?"

## 8. Aksesibilitas dan kinerja UI

- Fokus terlihat jelas, urutan tab logis, label ARIA untuk tombol ikon, `aria-live` untuk kembalian dan toast.
- Jangan hanya mengandalkan warna (tambah ikon/teks pada status stok).
- Target kinerja di HP Android kelas menengah: buka app < 2 detik (cache hangat), respon ketuk produk < 100 ms.
- Tema gelap didukung, layar tidak otomatis mati di halaman Kasir (`Wake Lock API`, jika tersedia).
