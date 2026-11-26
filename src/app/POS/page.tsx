import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardList,
  HandCoins,
  Package,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  WifiOff,
  Zap,
} from "lucide-react";
import { LandingNav } from "@/features/landing/LandingNav";

export const metadata = {
  title: "POS Arisol",
  robots: { index: false, follow: false },
  description:
    "Aplikasi kasir offline-first untuk Arisol: penjualan, stok, laporan, pre-order, dan titip jual.",
};

const features = [
  {
    icon: Zap,
    title: "Kasir cepat",
    body: "Cari produk, atur jumlah, pilih uang pas atau bayar, struk langsung jadi.",
  },
  {
    icon: WifiOff,
    title: "Tetap jalan offline",
    body: "Internet mati saat ramai? Transaksi tetap tersimpan di perangkat.",
  },
  {
    icon: Package,
    title: "Stok otomatis",
    body: "Setiap penjualan mengurangi stok. Riwayat perubahan tidak bisa dihapus diam-diam.",
  },
  {
    icon: BarChart3,
    title: "Laporan harian",
    body: "Omzet, laba kotor, produk terlaris, dan tutup hari dalam satu layar.",
  },
  {
    icon: ClipboardList,
    title: "Pre-order",
    body: "Catat pesanan, uang muka, dan sisa pembayaran tanpa buku catatan terpisah.",
  },
  {
    icon: HandCoins,
    title: "Titip jual",
    body: "Kelola barang konsinyasi, setoran, dan status lunas per mitra.",
  },
];

const steps = [
  {
    title: "Masuk dengan akun",
    body: "Dashboard hanya bisa dibuka oleh pemilik dan staf yang sudah terdaftar.",
  },
  {
    title: "Catat penjualan",
    body: "Pilih produk, terima pembayaran, dan stok langsung menyesuaikan.",
  },
  {
    title: "Tutup hari",
    body: "Cek omzet dan sisa stok, lalu ekspor laporan bila perlu.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <LandingNav />

      <main>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 sm:py-20 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-bold text-primary">
              <WifiOff size={14} /> Offline-first untuk lapak risol
            </span>
            <h1 className="mt-4 text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl">
              Jualan risol, <span className="text-primary">catatnya otomatis.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-ink-muted sm:text-lg">
              Kasir, stok, laporan, pre-order, dan titip jual dalam satu aplikasi yang
              tetap jalan tanpa internet. Cocok untuk lapak, gerai kecil, dan dapur
              rumahan.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/masuk"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-primary px-6 text-base font-bold text-on-primary hover:opacity-90"
              >
                Masuk ke dashboard <ArrowRight size={18} />
              </Link>
              <a
                href="#fitur"
                className="hover:bg-primary-soft/40 inline-flex min-h-[52px] items-center justify-center rounded-btn border border-border bg-surface px-6 text-base font-bold"
              >
                Lihat fitur
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-success" /> Tanpa internet
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-success" /> Bisa dipasang di HP
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-success" /> Data tersimpan lokal
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="bg-primary-soft/60 absolute -inset-4 -z-10 rounded-[32px] blur-2xl" />
            <div className="rounded-card border border-border bg-surface p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-muted">Kasir</p>
                  <p className="text-lg font-extrabold">Pesanan baru</p>
                </div>
                <span className="bg-success/10 rounded-full px-2.5 py-1 text-[11px] font-bold text-success">
                  Offline
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { name: "Risol Mayo", qty: 2, price: "Rp 10.000" },
                  { name: "Risol Ayam", qty: 3, price: "Rp 15.000" },
                  { name: "Es Teh", qty: 2, price: "Rp 6.000" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-btn border border-border px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-xs text-ink-muted">{item.qty} porsi</p>
                    </div>
                    <p className="text-sm font-bold tabular-nums">{item.price}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-semibold text-ink-muted">Total</span>
                <span className="text-xl font-black tabular-nums">Rp 31.000</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex min-h-[48px] items-center justify-center rounded-btn border border-border text-sm font-bold">
                  Uang pas
                </div>
                <div className="flex min-h-[48px] items-center justify-center rounded-btn bg-primary text-sm font-bold text-on-primary">
                  Bayar
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="fitur" className="bg-surface/60 border-y border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                Yang kamu butuhkan untuk jualan harian
              </h2>
              <p className="mt-2 text-sm text-ink-muted sm:text-base">
                Tanpa fitur berlebihan. Semua dibuat untuk alur lapak: cepat, jelas, dan
                tidak bikin ribet.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-card border border-border bg-surface p-5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-btn bg-primary-soft text-primary">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-3 text-base font-extrabold">{title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cara" className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                Mulai dalam tiga langkah
              </h2>
              <p className="mt-2 text-sm text-ink-muted sm:text-base">
                Akun dibuat oleh pemilik usaha agar dashboard tidak bisa dibuka sembarang
                orang.
              </p>
              <div className="mt-6 space-y-3">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    className="flex gap-3 rounded-card border border-border bg-surface p-4"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-on-primary">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold">{step.title}</h3>
                      <p className="mt-0.5 text-sm text-ink-muted">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-card border border-border bg-surface p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-btn bg-primary-soft text-primary">
                  <ShieldCheck size={22} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold">Akses terkontrol</h3>
                  <p className="text-xs text-ink-muted">
                    Hanya akun terdaftar yang bisa masuk
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-ink-muted">
                <li className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-success" />
                  Halaman publik hanya beranda dan form masuk.
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-success" />
                  Dashboard, stok, dan laporan wajib login.
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-success" />
                  Data tiap akun terpisah, tidak bercampur dengan pengguna lain.
                </li>
              </ul>
              <div className="mt-5 flex items-center gap-3 rounded-btn border border-border px-3 py-3">
                <Smartphone size={20} className="text-primary" />
                <p className="text-xs text-ink-muted">
                  Bisa dipasang di layar utama HP sebagai aplikasi.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-5 rounded-card bg-primary p-6 text-on-primary sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="text-xl font-black sm:text-2xl">
                Siap mencatat penjualan hari ini?
              </h2>
              <p className="text-on-primary/80 mt-1 text-sm">
                Masuk dengan akun yang sudah didaftarkan pemilik usaha.
              </p>
            </div>
            <Link
              href="/masuk"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-surface px-6 text-base font-bold text-primary hover:opacity-90"
            >
              Masuk sekarang <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-ink-muted sm:flex-row">
          <p>© {new Date().getFullYear()} POS Arisol. Aplikasi kasir lapak risol.</p>
          <div className="flex items-center gap-4">
            <Link href="/masuk" className="font-semibold hover:text-ink">
              Masuk
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw size={12} /> Data lokal + sinkron
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
