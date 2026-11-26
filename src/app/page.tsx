import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  HelpCircle,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";
import { MenuSection } from "@/features/landing/MenuSection";
import { PreorderForm } from "@/features/landing/PreorderForm";
import { Logo } from "@/ui/Logo";

const WHATSAPP =
  "https://wa.me/6285869836066?text=Halo%20Arisol%2C%20saya%20mau%20pre-order.";
const MAP_LINK = "https://maps.app.goo.gl/3EjwR6jKGgXt9nLM6";
const MAP_EMBED =
  "https://maps.google.com/maps?q=-7.0786873,110.4146975&z=16&output=embed";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Arisol - Risol Mayo Banyumanik",
  description:
    "Arisol: risol mayo, risoles ayam, risoles manis, dan kebab buatan rumahan di Banyumanik, Semarang. Buka pre-order untuk acara, rapat, dan snack box.",
  keywords: [
    "risol mayo",
    "risoles",
    "risol Banyumanik",
    "risol Semarang",
    "pre-order risol",
    "snack box Semarang",
    "kebab",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Arisol",
    title: "Arisol - Risol Mayo Banyumanik",
    description:
      "Risol mayo, risoles ayam, risoles manis, dan kebab buatan rumahan di Banyumanik. Pre-order untuk acara dan snack box.",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Arisol" }],
  },
  twitter: {
    card: "summary",
    title: "Arisol - Risol Mayo Banyumanik",
    description:
      "Risol mayo, risoles ayam, risoles manis, dan kebab buatan rumahan di Banyumanik.",
    images: ["/icon-512.png"],
  },
  robots: { index: true, follow: true },
};

const preorderSteps = [
  {
    title: "Pilih menu",
    body: "Tentukan jenis dan jumlah risol lewat form pre-order di samping.",
  },
  {
    title: "Kirim ke WhatsApp",
    body: "Pesanan otomatis terisi di WhatsApp. Kami cek ketersediaan dan totalnya.",
  },
  {
    title: "Ambil atau kirim",
    body: "Konfirmasi jadwal pengambilan atau pengiriman di area Banyumanik.",
  },
];

const faqs = [
  {
    question: "Minimal berapa lama pre-order?",
    answer:
      "Untuk jumlah banyak, sebaiknya pesan minimal H-1. Untuk pesanan mendadak, tanyakan dulu lewat WhatsApp.",
  },
  {
    question: "Bisa dikirim ke luar Banyumanik?",
    answer:
      "Pengiriman utama di area Banyumanik, Semarang. Untuk luar area, ongkir dan ketersediaan dikonfirmasi lewat WhatsApp.",
  },
  {
    question: "Tersedia frozen atau siap goreng?",
    answer:
      "Ya. Arisol menyediakan risol dalam bentuk frozen maupun yang sudah digoreng.",
  },
  {
    question: "Bagaimana cara pembayarannya?",
    answer:
      "Pembayaran bisa tunai, transfer, atau QRIS. Detail dan total akhir dikonfirmasi lewat WhatsApp.",
  },
];

export default function ArisolPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-border/70 bg-bg/90 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={42} priority />
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight">Arisol</div>
              <div className="text-[11px] font-semibold text-ink-muted">
                Risol Mayo - Banyumanik
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a
              href="#menu"
              className="hidden min-h-[44px] items-center rounded-btn px-3 text-sm font-semibold text-ink-muted hover:text-ink sm:inline-flex"
            >
              Menu
            </a>
            <a
              href="#preorder"
              className="hidden min-h-[44px] items-center rounded-btn px-3 text-sm font-semibold text-ink-muted hover:text-ink sm:inline-flex"
            >
              Pre-order
            </a>
            <a
              href="#kontak"
              className="hidden min-h-[44px] items-center rounded-btn px-3 text-sm font-semibold text-ink-muted hover:text-ink sm:inline-flex"
            >
              Kontak
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 sm:py-20 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-bold text-primary">
              <MapPin size={14} /> Banyumanik, Semarang
            </span>
            <h1 className="mt-4 text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl">
              Risol mayo hangat, <span className="text-primary">isian melimpah.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-ink-muted sm:text-lg">
              Camilan gurih buatan rumahan untuk santai, rapat, atau acara keluarga. Pesan
              langsung lewat WhatsApp, atau isi form pre-order untuk jumlah banyak.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="#preorder"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-primary px-6 text-base font-bold text-on-primary hover:opacity-90"
              >
                <MessageCircle size={18} /> Isi form pre-order
              </a>
              <a
                href="#menu"
                className="hover:bg-primary-soft/40 inline-flex min-h-[52px] items-center justify-center rounded-btn border border-border bg-surface px-6 text-base font-bold"
              >
                Lihat menu & harga
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-success" /> Dibuat saat dipesan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-success" /> Bisa frozen atau goreng
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-success" /> Pre-order jumlah banyak
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[360px]">
            <div className="bg-primary-soft/70 absolute inset-10 -z-10 rounded-full blur-3xl" />
            <Logo
              size={360}
              priority
              className="relative h-auto w-full drop-shadow-2xl"
            />
          </div>
        </section>

        <MenuSection />

        <section id="preorder" className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-bold text-primary">
                <Sparkles size={14} /> Pre-order
              </span>
              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                Pesan lebih awal untuk acara atau rapat
              </h2>
              <p className="mt-2 text-sm text-ink-muted sm:text-base">
                Pre-order membantu kami menyiapkan pesanan dalam jumlah banyak tanpa
                membuat kamu menunggu lama.
              </p>
              <div className="mt-6 space-y-3">
                {preorderSteps.map((step, index) => (
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
              <div className="mt-4 rounded-card border border-border bg-surface p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-btn bg-primary-soft text-primary">
                    <Users size={20} />
                  </span>
                  <h3 className="text-sm font-extrabold">Cocok untuk</h3>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                  <li className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-success" />
                    Rapat kantor dan arisan
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-success" />
                    Acara keluarga dan syukuran
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-success" />
                    Snack box dan oleh-oleh
                  </li>
                </ul>
              </div>
            </div>

            <PreorderForm />
          </div>
        </section>

        <section className="bg-surface/60 border-y border-border">
          <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:py-20">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-bold text-primary">
                <HelpCircle size={14} /> FAQ
              </span>
              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                Pertanyaan yang sering ditanya
              </h2>
            </div>
            <div className="mt-6 space-y-2">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-card border border-border bg-surface p-4"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-extrabold">
                    {faq.question}
                    <span className="text-primary transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-sm text-ink-muted">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="kontak" className="border-t border-border">
          <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-14 sm:grid-cols-2 sm:py-20">
            <div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                Mampir atau hubungi kami
              </h2>
              <p className="mt-2 max-w-md text-sm text-ink-muted sm:text-base">
                Arisol. Untuk pesanan hari ini, pre-order, atau pertanyaan menu, hubungi
                nomor di samping.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-btn bg-primary px-4 text-sm font-bold text-on-primary hover:opacity-90"
                >
                  <MessageCircle size={18} /> WhatsApp
                </a>
                <a
                  href="tel:085869836066"
                  className="hover:bg-primary-soft/40 inline-flex min-h-[48px] items-center gap-2 rounded-btn border border-border bg-surface px-4 text-sm font-bold"
                >
                  <Phone size={18} /> 0858 6983 6066
                </a>
              </div>
              <div className="mt-5 rounded-card border border-border bg-surface p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-primary-soft text-primary">
                    <MapPin size={20} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold">Toko Arisol</h3>
                    <p className="mt-1 text-sm text-ink-muted">
                      Banyumanik, Semarang. Pengambilan langsung atau pengiriman sekitar
                      area Banyumanik.
                    </p>
                    <a
                      href={MAP_LINK}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex min-h-[44px] items-center gap-1 text-sm font-bold text-primary"
                    >
                      Buka di Google Maps <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-card border border-border bg-surface">
              <iframe
                title="Lokasi Toko Arisol di Google Maps"
                src={MAP_EMBED}
                className="h-[320px] w-full sm:h-full sm:min-h-[360px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-ink-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Arisol.</p>
          <Link href="/privasi" className="font-semibold hover:text-ink">
            Kebijakan privasi
          </Link>
        </div>
      </footer>

      <a
        href={WHATSAPP}
        target="_blank"
        rel="noreferrer"
        aria-label="Hubungi Arisol lewat WhatsApp"
        className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle size={26} />
      </a>
    </div>
  );
}
