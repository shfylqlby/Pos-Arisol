"use client";

import { BackLink } from "@/ui/BackLink";
import React from "react";
import Link from "next/link";

const sections = [
  {
    title: "Mulai jualan",
    steps: [
      "Buka tab Kasir, ketuk produk untuk menambah ke keranjang.",
      "Ketuk keranjang di bawah untuk mengatur jumlah atau menghapus item.",
      "Pilih Tunai / QRIS / Transfer, masukkan uang diterima, lalu Bayar.",
      "Struk bisa dibagikan ke WhatsApp atau dicetak.",
    ],
  },
  {
    title: "Atur produk",
    steps: [
      "Buka Lainnya â†’ Produk.",
      "Tambah produk baru atau ketuk produk untuk mengubah harga/modal.",
      "Paket isi banyak memakai satuan dan jumlah per paket.",
    ],
  },
  {
    title: "Stok harian",
    steps: [
      "Buka tab Stok untuk melihat sisa stok hari ini.",
      "Catat produksi (masuk) dan terjual/rusak (keluar).",
      "Tutup hari lewat wizard Tutup Hari untuk menghitung sisa.",
    ],
  },
  {
    title: "Pesanan & titip jual",
    steps: [
      "Pesanan: catat pre-order, DP, dan tanggal ambil.",
      "Titip jual: catat barang yang dititipkan ke warung.",
      "Setoran dan harga khusus diatur di detail mitra.",
    ],
  },
  {
    title: "Laporan & backup",
    steps: [
      "Tab Laporan menampilkan omzet, laba kotor, dan produk terlaris.",
      "Ekspor CSV untuk arsip atau kirim ke WhatsApp.",
      "Lainnya â†’ Backup untuk menyimpan seluruh data ke file JSON.",
    ],
  },
];

export function PanduanScreen() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4">
      <BackLink />
      <h1 className="mb-1 text-lg font-extrabold">Panduan singkat</h1>
      <p className="mb-4 text-xs text-ink-muted">
        Aplikasi tetap jalan tanpa internet. Data tersimpan di perangkat ini.
      </p>

      <div className="flex flex-col gap-3">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-card border border-border bg-surface p-4"
          >
            <h2 className="mb-2 text-sm font-bold">{section.title}</h2>
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-xs text-ink-muted">
              {section.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <p className="mt-4 text-xs text-ink-muted">
        Butuh bantuan lain? Buka{" "}
        <Link href="/lainnya/tentang" className="font-semibold text-primary">
          Tentang
        </Link>{" "}
        untuk versi aplikasi, atau{" "}
        <Link href="/lainnya/log" className="font-semibold text-primary">
          Log
        </Link>{" "}
        bila terjadi error.
      </p>
    </div>
  );
}
