import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/ui/Logo";

export const metadata: Metadata = {
  title: "Kebijakan Privasi - Arisol",
  description:
    "Kebijakan privasi Arisol: data pesanan, data pelanggan, dan data operasional toko.",
};

export default function PrivasiPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-border/70 bg-bg/90 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={36} priority />
            <span className="text-sm font-extrabold">Arisol</span>
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"
          >
            <ArrowLeft size={16} /> Beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-black tracking-tight">Kebijakan Privasi</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Terakhir diperbarui: November 2026
        </p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-ink-muted">
          <section>
            <h2 className="text-base font-extrabold text-ink">Data yang kami terima</h2>
            <p className="mt-1">
              Saat kamu mengisi form pre-order, kami menerima nama, nomor WhatsApp, tanggal
              dan cara pengambilan atau pengiriman, alamat, serta detail pesanan. Data itu
              dikirim melalui WhatsApp dan dipakai untuk memproses pesananmu.
            </p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-ink">Data di aplikasi POS</h2>
            <p className="mt-1">
              Aplikasi kasir Arisol menyimpan data operasional toko di perangkat pemilik
              atau staf. Jika sinkronisasi cloud aktif, data disimpan di Supabase dengan
              akses terbatas pada akun toko. Kata sandi dan PIN tidak disimpan dalam bentuk
              teks biasa.
            </p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-ink">Pembagian data</h2>
            <p className="mt-1">
              Kami tidak menjual data pelanggan. Data hanya dipakai untuk operasional
              pesanan, laporan penjualan, dan kewajiban hukum yang berlaku.
            </p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-ink">Menghapus data</h2>
            <p className="mt-1">
              Kamu bisa meminta penghapusan data pesanan dengan menghubungi WhatsApp Arisol
              di 0858 6983 6066. Data transaksi tertentu dapat disimpan lebih lama untuk
              keperluan pembukuan.
            </p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-ink">Kontak</h2>
            <p className="mt-1">
              Pertanyaan tentang privasi bisa disampaikan lewat WhatsApp{" "}
              <a
                href="https://wa.me/6285869836066"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary"
              >
                0858 6983 6066
              </a>{" "}
              atau datang langsung ke Toko Arisol, Banyumanik, Semarang.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
