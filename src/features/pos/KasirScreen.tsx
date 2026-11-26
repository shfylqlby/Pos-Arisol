"use client";

import React, { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Search, ShoppingCart } from "lucide-react";
import { listProducts } from "@/data/repositories/products";
import { getAllProductsStock } from "@/data/repositories/stock";
import { getSettings } from "@/data/repositories/settings";
import type { Product, Sale, SaleItem } from "@/data/schemas";
import { useCartStore } from "./useCartStore";
import { calculateCartTotals } from "@/domain/cart";
import { formatRupiah } from "@/domain/money";
import { ProductTile } from "@/ui/ProductTile";
import { EmptyState } from "@/ui/EmptyState";
import { Button } from "@/ui/Button";
import { Stepper } from "@/ui/Stepper";
import { useToast } from "@/ui/Toast";
import { CartSheet } from "./CartSheet";
import { PaymentScreen } from "./PaymentScreen";
import { SuccessScreen } from "./SuccessScreen";
import { Onboarding } from "@/features/settings/Onboarding";
import { useWakeLock } from "@/lib/useWakeLock";

type View = "pos" | "pay" | "success";

export function KasirScreen() {
  const products = useLiveQuery(
    () => listProducts(false),
    [],
    undefined as Product[] | undefined
  );
  const stockMap = useLiveQuery(
    () => getAllProductsStock(),
    [],
    {} as Record<string, number>
  );
  const settings = useLiveQuery(() => getSettings(), [], undefined);

  const { items, discount, add, setQty, remove } = useCartStore();
  const { show } = useToast();

  const [category, setCategory] = useState("Semua");
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState<View>("pos");
  const [lastSale, setLastSale] = useState<{ sale: Sale; items: SaleItem[] } | null>(
    null
  );
  const [warnedProducts, setWarnedProducts] = useState<Set<string>>(new Set());
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  useWakeLock(view === "pos");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem("pos-onboarded");
    if (!done) setNeedsOnboarding(true);
  }, []);

  const totals = calculateCartTotals({ items, discount });

  const categories = useMemo(() => {
    if (!products) return ["Semua"];
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["Semua", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    let list = products;
    if (category !== "Semua") list = list.filter((p) => p.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, category, query]);

  const qtyInCart = (productId: string) =>
    items.find((i) => i.product.id === productId)?.qty ?? 0;

  const handleAdd = (product: Product) => {
    const stock = product.track_stock ? (stockMap[product.id] ?? 0) : 999;
    if (product.track_stock && stock <= 0 && !warnedProducts.has(product.id)) {
      setWarnedProducts((prev) => new Set(prev).add(product.id));
      show(`Stok ${product.name} 0. Tetap dijual?`, { tone: "warning" });
    }
    add(product, 1);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleSuccess = (sale: Sale, saleItems: SaleItem[]) => {
    setLastSale({ sale, items: saleItems });
    setView("success");
  };

  const handleNewTransaction = () => {
    setLastSale(null);
    setView("pos");
  };

  // Onboarding on first run (flag stored locally, no schema change)
  if (needsOnboarding) {
    return (
      <Onboarding
        onDone={() => {
          localStorage.setItem("pos-onboarded", "1");
          setNeedsOnboarding(false);
        }}
      />
    );
  }

  if (view === "pay") {
    return <PaymentScreen onBack={() => setView("pos")} onSuccess={handleSuccess} />;
  }

  if (view === "success" && lastSale) {
    return (
      <SuccessScreen
        sale={lastSale.sale}
        items={lastSale.items}
        onNewTransaction={handleNewTransaction}
      />
    );
  }

  const ProductGrid = (
    <div className="flex flex-col">
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={[
                "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold",
                category === c
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border bg-surface text-ink-muted",
              ].join(" ")}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {products && products.length > 12 && (
        <div className="px-4 pb-2">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari menu…"
              className="min-h-[44px] w-full rounded-btn border border-border bg-surface pl-10 pr-3 text-sm"
            />
          </div>
        </div>
      )}

      <div className="px-4 pb-4">
        {products === undefined ? (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-border/40 h-24 animate-pulse rounded-card" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="Belum ada menu"
            description="Tambah menu pertamamu untuk mulai jualan."
            action={
              <Button onClick={() => (window.location.href = "/lainnya/produk")}>
                Tambah menu
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="Menu tidak ditemukan" description="Coba kata kunci lain." />
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductTile
                key={p.id}
                product={p}
                stock={stockMap[p.id] ?? 0}
                qtyInCart={qtyInCart(p.id)}
                onClick={() => handleAdd(p)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const DesktopCart = (
    <div className="hidden w-80 shrink-0 flex-col border-l border-border bg-surface lg:flex xl:w-96">
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <span className="font-bold">Keranjang</span>
        <span className="text-xs text-ink-muted">{totals.totalItems} item</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <EmptyState title="Belum ada item" description="Ketuk menu di kiri." />
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.product.id} className="rounded-btn border border-border p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {item.product.name}
                    </div>
                    <div className="text-xs text-ink-muted">
                      {formatRupiah(item.unitPrice)}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(item.product.id)}
                    className="text-xs font-semibold text-danger"
                  >
                    Hapus
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <Stepper
                    value={item.qty}
                    onChange={(v) => setQty(item.product.id, v)}
                  />
                  <span className="text-sm font-bold tabular-nums">
                    {formatRupiah(item.qty * item.unitPrice)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-border p-3">
        <div className="mb-2 flex justify-between text-base font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatRupiah(totals.total)}</span>
        </div>
        <Button
          size="lg"
          fullWidth
          disabled={items.length === 0}
          onClick={() => setView("pay")}
        >
          BAYAR {formatRupiah(totals.total)}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] lg:min-h-0">
      <h1 className="sr-only">Kasir</h1>
      <div className="flex min-w-0 flex-1 flex-col">{ProductGrid}</div>
      {DesktopCart}

      {/* Mobile cart bar */}
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-14 z-30 border-t border-border bg-surface p-3 lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-2">
            <button
              onClick={() => setCartOpen(true)}
              className="flex flex-1 items-center gap-2 rounded-btn bg-primary-soft px-3 py-2 text-left"
            >
              <ShoppingCart size={18} className="text-primary" />
              <span className="flex-1 text-sm font-semibold">
                {totals.totalItems} item
              </span>
              <span className="text-sm font-bold tabular-nums">
                {formatRupiah(totals.total)}
              </span>
            </button>
            <Button onClick={() => setView("pay")} className="px-5">
              BAYAR
            </Button>
          </div>
        </div>
      )}

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setView("pay");
        }}
      />
    </div>
  );
}
