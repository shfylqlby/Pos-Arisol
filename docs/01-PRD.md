# 01. PRD: POS Risol

## 1. Masalah

Penjual risol skala lapak biasanya mencatat di buku atau tidak mencatat sama sekali. Akibatnya:
- Tidak tahu laba bersih harian, hanya tahu uang di laci.
- Produksi sering kelebihan (risol sisa basi) atau kurang (kehabisan saat ramai).
- Pesanan (pre-order untuk acara/arisan) dan risol yang dititip ke warung tercatat di chat WhatsApp dan gampang terlewat.
- Aplikasi kasir yang ada terlalu rumit, butuh internet, atau berlangganan mahal.

## 2. Persona

**Bu Sari (42), pemilik gerobak risol.** Jualan sendiri di depan sekolah dan terima pesanan lewat WhatsApp. Pakai HP Android kelas menengah, sinyal sering lemah. Tangan sering berminyak. Ramai 30-60 menit saat bubaran sekolah, jadi transaksi harus selesai dalam hitungan detik. Di rumah malam hari ia mengecek hasil lewat laptop anak.

**Prinsip dari persona:** cepat, besar, sedikit ketikan, tidak pernah gagal karena sinyal.

## 3. Tujuan dan non-tujuan

**Tujuan MVP**
- Transaksi kasir selesai dalam **≤ 3 ketukan** untuk kasus umum (pilih menu, bayar tunai pas/uang pas, selesai).
- Penjual tahu **omzet, laba, sisa stok** hari ini dalam satu layar.
- Pre-order dan titip jual tercatat dan punya status jelas.
- Seluruh alur kasir jalan **tanpa internet**.

**Bukan tujuan MVP**
- Multi-pengguna, multi-cabang, role dan hak akses.
- Payment gateway/QRIS dinamis, integrasi e-wallet.
- Resep/BOM dan stok bahan baku.
- Pajak, diskon kompleks, loyalty, voucher.
- Integrasi ojek online/marketplace.
- Cetak thermal Bluetooth (stretch goal setelah M8).

## 4. Fitur dan acceptance criteria

### F1. Kasir cepat + struk

User story: sebagai penjual, saya ingin menambah item ke keranjang dengan satu ketukan dan menutup transaksi cepat.

- Grid produk besar, tiap kartu: nama, harga, sisa stok. Ketuk = +1. Tahan atau tombol +/- untuk ubah jumlah.
- Mendukung **harga satuan dan paket** (contoh: 1 pcs Rp 3.000, paket isi 5 Rp 14.000). Paket adalah produk varian dengan `unit_qty` untuk potong stok.
- Keranjang menampilkan item, subtotal, total. Bisa hapus item, kosongkan keranjang.
- Pembayaran: **Tunai** (tombol uang cepat: Uang Pas, 5.000, 10.000, 20.000, 50.000, 100.000, input manual; hitung kembalian), **QRIS** (tampilkan gambar QR milik penjual, tombol "Sudah dibayar"), **Transfer** (catatan bank, konfirmasi manual).
- Diskon sederhana opsional: nominal Rupiah per transaksi. Tanpa persen di MVP.
- Setelah bayar: layar sukses dengan kembalian besar, tombol "Transaksi baru" (default fokus), "Bagikan struk".
- Struk: nama usaha, tanggal-jam, nomor struk berurut harian (`A-0001`), item, total, bayar, kembalian. Bagikan sebagai teks WhatsApp dan gambar; cetak lewat dialog cetak browser.
- Stok berkurang otomatis. Jika stok produk 0, kartu ditandai "Habis" tapi **tetap bisa dijual** (peringatan, bukan blokir; stok bisa belum diinput).
- Batalkan transaksi (void) dengan alasan; membuat reversal, stok kembali.
- Semua di atas jalan offline.

### F2. Stok & produksi harian

- **Produksi:** catat "hari ini bikin berapa" per produk (menambah stok).
- **Penyesuaian akhir hari (tutup hari):** input sisa fisik per produk; selisih dicatat sebagai `waste` (basi/rusak/dikonsumsi sendiri) dengan alasan.
- Layar stok: stok saat ini, terjual hari ini, diproduksi hari ini, ambang "hampir habis" per produk (default 10).
- Riwayat pergerakan stok per produk (ledger).
- Stok dihitung dari ledger (lihat 04-DATA-MODEL). Tidak ada edit stok langsung.

### F3. Laporan penjualan & laba

- Filter: Hari ini, Kemarin, 7 hari, Bulan ini, rentang kustom.
- Kartu ringkas: **Omzet, HPP, Laba kotor, Jumlah transaksi, Rata-rata per transaksi, Waste (nilai modal)**.
- Daftar menu terlaris (qty dan omzet).
- Rincian per metode bayar (tunai/QRIS/transfer).
- Grafik batang omzet per hari (untuk rentang ≥ 7 hari).
- Daftar transaksi, buka detail, void dari sini.
- Ekspor **CSV** (transaksi dan ringkasan).
- HPP dihitung dari `cost_price` produk **pada saat transaksi** (snapshot di `sale_items`), supaya perubahan harga modal tidak mengubah laporan lama.

### F4. Pre-order

- Buat pesanan: nama pelanggan, no. WhatsApp, tanggal-jam ambil/antar, item dan qty, catatan, DP (opsional).
- Status: `Baru` → `Diproduksi` → `Siap` → `Selesai` (atau `Dibatalkan`).
- Daftar pesanan terurut tanggal ambil; badge "Hari ini", "Terlambat".
- Ringkasan kebutuhan produksi: total qty per produk untuk pesanan tanggal tertentu (membantu rencana produksi).
- Saat `Selesai`: buat transaksi penjualan (sisa pembayaran = total dikurangi DP), stok berkurang saat itu.
- Tombol "Kirim pengingat/konfirmasi" membuka WhatsApp dengan teks template (tanpa API).

### F5. Titip jual (konsinyasi), versi sederhana

- Kelola **mitra** (warung/kantin): nama, kontak, harga setoran per produk (harga untuk mitra, biasanya di bawah harga jual).
- **Pengiriman (drop):** catat produk dan qty yang dititip ke mitra (stok berkurang, tipe movement `consignment_out`).
- **Setoran:** pada periode tertentu, input qty terjual dan qty retur per produk. Sistem hitung `tagihan = terjual × harga setoran`. Retur menambah stok kembali (`consignment_return`).
- Sisa di mitra = dikirim − terjual − retur, ditampilkan per mitra.
- Status setoran: `Belum dibayar` / `Lunas`, dengan catatan tanggal bayar.
- Pembayaran setoran masuk ke laporan sebagai omzet titip jual (terpisah dari omzet kasir, bisa digabung di filter).
- Tidak ada akun/login untuk mitra.

### F6. Pendukung

- Kelola produk: nama, harga jual, modal per pcs, `unit_qty`, aktif/nonaktif, urutan tampil, foto opsional (kompres di klien, simpan lokal).
- Pengaturan usaha: nama, alamat/kontak (untuk struk), gambar QRIS, zona waktu, ambang stok.
- Login (email magic link atau Google) dan **sinkronisasi** antar perangkat (M5). Aplikasi dapat dipakai tanpa login sebelum M5, data lokal.
- Kunci PIN lokal 4 digit opsional (HP dipakai bersama anak/karyawan).
- Backup: ekspor seluruh data ke JSON, impor kembali.

## 5. Metrik keberhasilan (pilot dengan 3-5 penjual)

- Median waktu transaksi tunai ≤ 10 detik.
- ≥ 90% hari berjualan tercatat penuh (ada penjualan dan penutupan hari) setelah 2 minggu.
- 0 transaksi hilang saat offline-ke-online.
- Penjual bisa menjawab "untung hari ini berapa" tanpa menghitung manual.

## 6. Risiko dan asumsi yang perlu diuji

| Asumsi / risiko | Dampak jika salah | Cara uji |
|---|---|---|
| Penjual mau input produksi dan sisa harian | Stok tidak akurat, F2 tidak berguna | Pilot 1 minggu, ukur berapa hari terisi |
| Modal per pcs diketahui penjual | Laba salah | Sediakan kalkulator bantu "modal per batch ÷ jumlah jadi" |
| Titip jual cocok dengan alur lapak 1 orang | Fitur jarang dipakai | Tanya apakah ≥ 2 mitra aktif; jika tidak, tunda polishing |
| Sinyal buruk bikin sync gagal terus | Data antar perangkat beda | Antrean outbox dengan retry + indikator jelas |
| iOS Safari membatasi PWA/IndexedDB | Data hilang jika tidak dipakai lama | Banner anjuran "Tambah ke Layar Utama", tombol backup |
| Beda perangkat edit data yang sama | Konflik | Aturan konflik di 03-ARCHITECTURE bagian Sync |

## 7. Pertanyaan terbuka (butuh jawaban pemilik produk)

1. Nama produk/brand aplikasi dan logo?
2. Apakah harga jual untuk pre-order boleh berbeda dari harga kasir?
3. Apakah risol frozen (belum digoreng) dijual terpisah dari yang matang? Jika ya, perlu dua varian stok per menu.
4. Apakah nomor struk di-reset harian atau berurut terus?
