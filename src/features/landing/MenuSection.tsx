"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { formatRupiah } from "@/domain/money";
import { MENU_POSTERS } from "@/features/landing/menu-data";
import { usePublicMenu } from "@/features/landing/usePublicMenu";
import { Lightbox, type LightboxImage } from "@/features/landing/Lightbox";

export function MenuSection() {
  const items = usePublicMenu();
  const [viewer, setViewer] = useState<LightboxImage | null>(null);

  const categories = useMemo(() => {
    const grouped = new Map<string, typeof items>();
    for (const item of items) {
      const list = grouped.get(item.category) ?? [];
      list.push(item);
      grouped.set(item.category, list);
    }
    return Array.from(grouped.entries());
  }, [items]);

  const photos = items.filter((item) => item.image_url);
  const hasPhotos = photos.length > 0;

  return (
    <section id="menu" className="bg-surface/60 border-y border-border">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Menu & harga</h2>
          <p className="mt-2 text-sm text-ink-muted sm:text-base">
            Harga dapat berubah dan beberapa varian tersedia bergilir. Konfirmasi
            ketersediaan lewat WhatsApp sebelum memesan.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            {hasPhotos ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {photos.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() =>
                        setViewer({ src: item.image_url as string, alt: item.name })
                      }
                      className="group overflow-hidden rounded-card border border-border bg-surface text-left"
                    >
                      <div className="relative aspect-square">
                        <Image
                          src={item.image_url as string}
                          alt={item.name}
                          fill
                          sizes="(max-width: 1024px) 50vw, 22vw"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                        <span className="truncate font-semibold">{item.name}</span>
                        <span className="shrink-0 font-bold text-primary">
                          {formatRupiah(item.price)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  Klik foto untuk melihat ukuran penuh.
                </p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setViewer({
                      src: MENU_POSTERS[0].src,
                      alt: "Poster menu dan harga Arisol",
                    })
                  }
                  className="block w-full overflow-hidden rounded-card border border-border bg-surface text-left shadow-sm"
                >
                  <Image
                    src={MENU_POSTERS[0].src}
                    alt="Poster menu dan harga Arisol"
                    width={1240}
                    height={1754}
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="h-auto w-full"
                  />
                </button>
                <p className="mt-2 text-xs text-ink-muted">
                  Klik poster untuk melihat ukuran penuh.
                </p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {MENU_POSTERS.map((poster) => (
                    <button
                      type="button"
                      key={poster.src}
                      onClick={() =>
                        setViewer({ src: poster.src, alt: `Poster ${poster.label}` })
                      }
                      className="overflow-hidden rounded-btn border border-border bg-surface"
                      aria-label={`Lihat poster ${poster.label}`}
                    >
                      <Image
                        src={poster.src}
                        alt={`Poster ${poster.label}`}
                        width={310}
                        height={439}
                        sizes="(max-width: 1024px) 22vw, 10vw"
                        className="h-auto w-full"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="space-y-3">
            {categories.map(([category, categoryItems]) => (
              <div key={category} className="rounded-card border border-border bg-surface p-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-primary">
                  {category}
                </h3>
                <ul className="mt-2 divide-y divide-border">
                  {categoryItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-2 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {item.image_url && (
                          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-btn">
                            <Image
                              src={item.image_url}
                              alt=""
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          </span>
                        )}
                        <span className="text-ink">{item.name}</span>
                        {item.stock_qty !== null && (
                          <span
                            className={
                              item.stock_qty <= 0
                                ? "shrink-0 text-[11px] font-bold text-danger"
                                : "shrink-0 text-[11px] text-success"
                            }
                          >
                            {item.stock_qty <= 0 ? "Habis" : `Sisa ${item.stock_qty}`}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-bold tabular-nums">
                        {formatRupiah(item.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-xs text-ink-muted">
              Harga di atas adalah estimasi. Total akhir dan ongkir dikonfirmasi lewat
              WhatsApp.
            </p>
          </div>
        </div>
      </div>
      <Lightbox image={viewer} onClose={() => setViewer(null)} />
    </section>
  );
}
