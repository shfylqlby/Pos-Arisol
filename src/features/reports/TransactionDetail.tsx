"use client";

import React, { useState } from "react";
import { Ban, Printer, Image as ImageIcon } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import type { Sale, SaleItem, VoidReason } from "@/data/schemas";
import { formatRupiah } from "@/domain/money";
import { formatDateTime } from "@/lib/date";
import { voidSale } from "@/data/repositories/sales";
import { getSettings } from "@/data/repositories/settings";
import {
  printHtml,
  receiptHtml,
  shareReceiptPng,
  type ReceiptPrintOptions,
} from "@/lib/share";
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

export function TransactionDetail({
  sale,
  items,
  isVoid,
  onClose,
}: TransactionDetailProps) {
  const { show } = useToast();
  const settings = useLiveQuery(() => getSettings(), [], undefined);
  const [voidOpen, setVoidOpen] = useState(false);
  const [reason, setReason] = useState<VoidReason>("salah_input");
  const [saving, setSaving] = useState(false);

  const buildReceiptOptions = (): ReceiptPrintOptions | null => {
    if (!settings) return null;
    return {
      businessName: settings.business_name,
      address: settings.address,
      phone: settings.phone,
      receiptNo: sale.receipt_no,
      dateText: formatDateTime(sale.created_at, settings.timezone),
      items: items.map((i) => ({
        name: i.product_name,
        qty: i.qty,
        unitPrice: formatRupiah(i.unit_price),
        lineTotal: formatRupiah(i.qty * i.unit_price),
      })),
      subtotal: formatRupiah(sale.subtotal),
      discount: sale.discount > 0 ? formatRupiah(sale.discount) : undefined,
      total: formatRupiah(sale.total),
      paid: formatRupiah(sale.paid_amount),
      change: formatRupiah(sale.change_amount),
      paymentLabel:
        sale.payment_method === "cash"
          ? "Tunai"
          : sale.payment_method === "qris"
            ? "QRIS"
            : "Transfer",
      footer: settings.receipt_footer,
    };
  };

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

          <div className="bg-primary-soft/50 rounded-card p-3 text-sm">
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

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                const opts = buildReceiptOptions();
                if (opts) printHtml(receiptHtml(opts));
              }}
            >
              <Printer size={18} /> Cetak
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                const opts = buildReceiptOptions();
                if (opts) await shareReceiptPng(opts, `struk-${sale.receipt_no}.png`);
              }}
            >
              <ImageIcon size={18} /> Gambar
            </Button>
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
