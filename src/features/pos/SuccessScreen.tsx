"use client";

import React, { useEffect } from "react";
import { CheckCircle2, Share2, Printer, Image as ImageIcon } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { getSettings } from "@/data/repositories/settings";
import type { Sale, SaleItem } from "@/data/schemas";
import { formatRupiah } from "@/domain/money";
import { formatDateTime } from "@/lib/date";
import { formatWhatsAppReceipt } from "@/domain/receipt";
import { Button } from "@/ui/Button";
import {
  shareText,
  printHtml,
  receiptHtml,
  shareReceiptPng,
  type ReceiptPrintOptions,
} from "@/lib/share";

interface SuccessScreenProps {
  sale: Sale;
  items: SaleItem[];
  onNewTransaction: () => void;
}

export function SuccessScreen({ sale, items, onNewTransaction }: SuccessScreenProps) {
  const settings = useLiveQuery(() => getSettings(), [], undefined);
  const autoReturn = settings?.auto_return_seconds ?? 8;

  useEffect(() => {
    if (!autoReturn || autoReturn <= 0) return;
    const t = setTimeout(() => onNewTransaction(), autoReturn * 1000);
    return () => clearTimeout(t);
  }, [autoReturn, onNewTransaction]);

  const handleShare = async () => {
    if (!settings) return;
    const text = formatWhatsAppReceipt(sale, items, settings);
    await shareText(text, "Struk");
  };

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

  const handlePrint = () => {
    const opts = buildReceiptOptions();
    if (!opts) return;
    printHtml(receiptHtml(opts));
  };

  const handleImage = async () => {
    const opts = buildReceiptOptions();
    if (!opts) return;
    await shareReceiptPng(opts, `struk-${sale.receipt_no}.png`);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm text-center">
        <div className="bg-success/10 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-success">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-lg font-bold">Transaksi tersimpan</h1>
        <div className="mt-4 text-xs font-medium text-ink-muted">Kembalian</div>
        <div className="text-4xl font-extrabold tabular-nums text-success">
          {formatRupiah(sale.change_amount)}
        </div>
        <div className="mt-2 text-sm text-ink-muted">Struk {sale.receipt_no}</div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <Button variant="secondary" onClick={handleShare}>
            <Share2 size={18} /> Teks
          </Button>
          <Button variant="secondary" onClick={handleImage}>
            <ImageIcon size={18} /> Gambar
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            <Printer size={18} /> Cetak
          </Button>
        </div>

        <Button size="lg" fullWidth className="mt-3" onClick={onNewTransaction} autoFocus>
          TRANSAKSI BARU
        </Button>
        {autoReturn > 0 && (
          <p className="mt-2 text-xs text-ink-muted">
            Kembali otomatis dalam {autoReturn} detik
          </p>
        )}
      </div>
    </div>
  );
}
