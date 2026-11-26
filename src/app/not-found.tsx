import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center text-ink">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Search size={26} />
      </span>
      <h1 className="mt-4 text-2xl font-black">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        Alamat yang kamu buka tidak tersedia. Kembali ke beranda Arisol atau halaman POS.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-btn bg-primary px-5 text-sm font-bold text-on-primary"
        >
          <ArrowLeft size={16} /> Beranda
        </Link>
        <Link
          href="/POS"
          className="inline-flex min-h-[48px] items-center justify-center rounded-btn border border-border bg-surface px-5 text-sm font-bold"
        >
          Halaman POS
        </Link>
      </div>
    </div>
  );
}
