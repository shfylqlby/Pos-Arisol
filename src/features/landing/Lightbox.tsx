"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export type LightboxImage = { src: string; alt: string };

export function Lightbox({
  image,
  onClose,
}: {
  image: LightboxImage | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const open = image !== null;

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Entri riwayat sendiri: tombol Back HP menutup foto, bukan keluar halaman.
    // Spread state lama agar penanda internal Next.js tidak hilang.
    window.history.pushState({ ...window.history.state, lightbox: true }, "");
    closeRef.current?.focus();

    const onPop = () => onCloseRef.current();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") window.history.back();
      // Satu-satunya elemen fokus adalah tombol Tutup: kunci fokus di dalam dialog.
      if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      trigger?.focus?.();
    };
  }, [open]);

  if (!image) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      onClick={() => window.history.back()}
    >
      <div className="flex h-14 shrink-0 items-center justify-end px-2">
        <button
          ref={closeRef}
          type="button"
          onClick={(event) => {
            event.stopPropagation(); // jangan ikut memicu klik latar: back dua kali = keluar halaman
            window.history.back();
          }}
          aria-label="Tutup foto"
          className="flex h-11 items-center gap-2 rounded-btn bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20"
        >
          <X size={18} /> Tutup
        </button>
      </div>
      <div
        className="relative flex-1 overflow-auto px-4 pb-6"
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          src={image.src}
          alt={image.alt}
          width={1240}
          height={1754}
          sizes="100vw"
          className="mx-auto h-auto max-h-full w-auto max-w-full object-contain"
        />
      </div>
    </div>
  );
}
