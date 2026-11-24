"use client";

import React from "react";
import type { Product } from "@/data/schemas";
import { formatRupiah } from "@/domain/money";
import { getStockStatus } from "@/domain/stock";

interface ProductTileProps {
  product: Product;
  stock: number;
  qtyInCart: number;
  onClick: () => void;
}

export function ProductTile({ product, stock, qtyInCart, onClick }: ProductTileProps) {
  const status = getStockStatus(stock, product.low_stock_threshold ?? 10);
  const showStock = product.track_stock;

  return (
    <button
      onClick={onClick}
      className="relative flex min-h-[96px] flex-col justify-between rounded-card border border-border bg-surface p-3 text-left transition-transform duration-100 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {qtyInCart > 0 && (
        <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-on-primary">
          {qtyInCart}
        </span>
      )}
      <div className="pr-6">
        <div className="line-clamp-2 text-sm font-semibold leading-tight text-ink">
          {product.name}
        </div>
      </div>
      <div className="mt-2">
        <div className="tabular-nums text-base font-bold text-primary">
          {formatRupiah(product.price)}
        </div>
        {showStock && (
          <div
            className={[
              "mt-0.5 text-xs font-medium",
              status.status === "out_of_stock"
                ? "text-danger"
                : status.status === "low_stock"
                ? "text-warning"
                : "text-ink-muted",
            ].join(" ")}
          >
            {status.status === "out_of_stock"
              ? "Habis"
              : `sisa ${stock}`}
            {status.status === "low_stock" && " (menipis)"}
          </div>
        )}
        {!showStock && (
          <div className="mt-0.5 text-xs text-ink-muted">Paket</div>
        )}
      </div>
    </button>
  );
}
