"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import { listProducts, deleteProduct, reorderProducts } from "@/data/repositories/products";
import { getAllProductsStock } from "@/data/repositories/stock";
import type { Product } from "@/data/schemas";
import { formatRupiah } from "@/domain/money";
import { Button } from "@/ui/Button";
import { Modal } from "@/ui/Modal";
import { Chip } from "@/ui/Chip";
import { EmptyState } from "@/ui/EmptyState";
import { ProductForm } from "./ProductForm";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { useToast } from "@/ui/Toast";

export function ProductsScreen() {
  const products = useLiveQuery(() => listProducts(true), [], undefined);
  const stockMap = useLiveQuery(() => getAllProductsStock(), [], {} as Record<string, number>);
  const { show } = useToast();

  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const move = async (index: number, dir: -1 | 1) => {
    if (!products) return;
    const ids = products.map((p) => p.id);
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await reorderProducts(ids);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-extrabold">Produk</h1>
        <Button onClick={() => setEditing("new")}>
          <Plus size={18} /> Tambah
        </Button>
      </div>

      {products === undefined ? (
        <div className="h-40 animate-pulse rounded-card bg-border/40" />
      ) : products.length === 0 ? (
        <EmptyState
          title="Belum ada produk"
          description="Tambahkan menu pertamamu."
          action={<Button onClick={() => setEditing("new")}>Tambah produk</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {products.map((p, idx) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-card border border-border bg-surface p-3"
            >
              <div className="flex flex-col">
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="text-ink-muted disabled:opacity-30"
                  aria-label="Naikkan"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === products.length - 1}
                  className="text-ink-muted disabled:opacity-30"
                  aria-label="Turunkan"
                >
                  <ArrowDown size={16} />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{p.name}</span>
                  {p.kind === "bundle" && <Chip tone="primary">Paket</Chip>}
                  {!p.is_active && <Chip tone="danger">Nonaktif</Chip>}
                </div>
                <div className="text-xs text-ink-muted">
                  {formatRupiah(p.price)} · modal {formatRupiah(p.cost_price)}
                  {p.track_stock ? ` · stok ${stockMap[p.id] ?? 0}` : " · stok dari produk dasar"}
                </div>
              </div>

              <button
                onClick={() => setEditing(p)}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary-soft/50"
                aria-label="Ubah"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => setDeleting(p)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-danger hover:bg-danger/10"
                aria-label="Hapus"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing !== null && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={editing === "new" ? "Produk baru" : "Ubah produk"}
        >
          <ProductForm
            product={editing === "new" ? undefined : editing}
            allProducts={products || []}
            onDone={() => setEditing(null)}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus produk?"
        message={`${deleting?.name ?? ""} tidak akan tampil lagi di kasir. Riwayat transaksi tetap aman.`}
        confirmLabel="Hapus"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) {
            await deleteProduct(deleting.id);
            show("Produk dihapus", { tone: "success" });
          }
          setDeleting(null);
        }}
      />
    </div>
  );
}
