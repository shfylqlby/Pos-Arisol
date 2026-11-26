"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { useCartStore } from "./useCartStore";
import { calculateCartTotals } from "@/domain/cart";
import { formatRupiah, parseRupiah } from "@/domain/money";
import { BottomSheet } from "@/ui/BottomSheet";
import { Stepper } from "@/ui/Stepper";
import { Button } from "@/ui/Button";
import { TextInput, Field } from "@/ui/Field";
import { EmptyState } from "@/ui/EmptyState";
import { ShoppingBasket } from "lucide-react";

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartSheet({ open, onClose, onCheckout }: CartSheetProps) {
  const { items, discount, setQty, remove, setDiscount, clear } = useCartStore();
  const totals = calculateCartTotals({ items, discount });
  const [discountText, setDiscountText] = useState(discount > 0 ? String(discount) : "");

  return (
    <BottomSheet open={open} onClose={onClose} title="Keranjang">
      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBasket size={40} />}
          title="Keranjang masih kosong"
          description="Ketuk menu untuk menambah."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col divide-y divide-border">
            {items.map((item) => (
              <li key={item.product.id} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {item.product.name}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {formatRupiah(item.unitPrice)} / item
                  </div>
                </div>
                <Stepper value={item.qty} onChange={(v) => setQty(item.product.id, v)} />
                <div className="w-20 text-right">
                  <div className="text-sm font-bold tabular-nums">
                    {formatRupiah(item.qty * item.unitPrice)}
                  </div>
                </div>
                <button
                  onClick={() => remove(item.product.id)}
                  className="hover:bg-danger/10 flex h-10 w-10 items-center justify-center rounded-full text-danger"
                  aria-label={`Hapus ${item.product.name}`}
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>

          <Field label="Diskon (Rp)">
            <TextInput
              inputMode="numeric"
              placeholder="0"
              value={discountText}
              onChange={(e) => {
                const v = e.target.value;
                setDiscountText(v);
                setDiscount(parseRupiah(v));
              }}
            />
          </Field>

          <div className="bg-primary-soft/50 rounded-card p-3">
            <div className="flex justify-between text-sm text-ink-muted">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatRupiah(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-sm text-ink-muted">
                <span>Diskon</span>
                <span className="tabular-nums">-{formatRupiah(totals.discount)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between text-base font-bold text-ink">
              <span>Total</span>
              <span className="tabular-nums">{formatRupiah(totals.total)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={clear} className="flex-1">
              Kosongkan
            </Button>
            <Button onClick={onCheckout} className="flex-[2]">
              Bayar {formatRupiah(totals.total)}
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
