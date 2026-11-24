"use client";

import React, { useState } from "react";
import { Ban } from "lucide-react";
import type { Sale, SaleItem, VoidReason } from "@/data/schemas";
import { formatRupiah } from "@/domain/money";
import { formatDateTime } from "@/lib/date";
import { voidSale } from "@/data/repositories/sales";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { useToast } from "@/ui/Toast";

interface TransactionDetailProps {
  sale: Sale;
  items: SaleItem[];
  isVoid: boolean;
  onClose: () => void;
}

const reasons: { value: VoidReason; label: string }[] = [
  { value: "salah_input", label: "Salah input" },
  { value: "batal_pembeli", label: "Batal pembeli" },
  { value: "lainnya", label: "Lainnya" },
];

export function TransactionDetail({ sale, items, isVoid, onClose }: TransactionDetailProps) {
  const { show } = useToast();
  const [voidOpen, setVoidOpen] = useState(false);
  const [reason, setReason] = useState<VoidReason>("salah_input");
  const [saving, setSaving] = useState(false);

  const doVoid = async () => {
    setSaving(true);
    try {
      await voidSale(sale.id, reason);
      show("Transaksi dibatalkan, stok dikembalikan", { tone: "success" });
      setVoidOpen(false);
      onClose();
    } catch (err) {
      console.error(err);
      show(err instanceof Error ? err.message : "Gagal membatalkan", { tone: "warning" });
    } finally {
      setSaving(false);
    }
  };

  const paymentLabel =
    sale.payment_method === "cash"
      ? "Tunai"
      : sale.payment_method === "qris"
      ? "QRIS"
      : "Transfer";

  return (
    <>
      <Modal open onClose={onClose} title={`Struk ${sale.receipt_no}`}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">
              {formatDateTime(sale.created_at)}
            </span>
            {isVoid ? <Chip tone="danger">Void</Chip> : <Chip tone="success">Lunas</Chip>}
          </div>

          <ul className="flex flex-col divide-y divide-border rounded-card border border-border">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between px-3 py-2 text-sm">
                <span>
                  {i.product_name} x{i.qty}
                </span>
                <span className="tabular-nums">{formatRupiah(i.qty * i.unit_price)}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-card bg-primary-soft/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Subtotal</span>
              <span className="tabular-nums">{formatRupiah(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-muted">Diskon</span>
                <span className="tabular-nums">-{formatRupiah(sale.discount)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatRupiah(sale.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Bayar ({paymentLabel})</span>
              <span className="tabular-nums">{formatRupiah(sale.paid_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Kembalian</span>
              <span className="tabular-nums">{formatRupiah(sale.change_amount)}</span>
            </div>
          </div>

          {!isVoid && (
            <Button variant="danger" onClick={() => setVoidOpen(true)}>
              <Ban size={18} /> Batalkan transaksi (void)
            </Button>
          )}
        </div>
      </Modal>

      <Modal
        open={voidOpen}
        onClose={() => setVoidOpen(false)}
        title="Batalkan transaksi?"
        footer={
          <Button variant="danger" fullWidth disabled={saving} onClick={doVoid}>
            {saving ? "Membatalkan…" : "Ya, batalkan"}
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-muted">
            Stok akan dikembalikan dan transaksi ditandai void. Pilih alasan:
          </p>
          <div className="flex flex-wrap gap-2">
            {reasons.map((r) => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-semibold",
                  reason === r.value
                    ? "border-danger bg-danger text-white"
                    : "border-border bg-surface text-ink-muted",
                ].join(" ")}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
