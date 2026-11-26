"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center text-ink">
      <h1 className="text-2xl font-black">Terjadi kesalahan</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        Halaman gagal dimuat. Coba muat ulang. Kalau masih bermasalah, buka menu Lainnya →
        Log di aplikasi POS.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-btn bg-primary px-5 text-sm font-bold text-on-primary"
      >
        <RotateCcw size={16} /> Coba lagi
      </button>
    </div>
  );
}
