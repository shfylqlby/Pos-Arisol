"use client";

import React, { useEffect } from "react";
import { CheckCircle2, Share2, Printer } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { getSettings } from "@/data/repositories/settings";
import type { Sale, SaleItem } from "@/data/schemas";
import { formatRupiah } from "@/domain/money";
import { formatDateTime } from "@/lib/date";
import { formatWhatsAppReceipt } from "@/domain/receipt";
import { Button } from "@/ui/Button";
import { shareText, printHtml, receiptHtml } from "@/lib/share";

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

  const handlePrint = () => {
    if (!settings) return;
    const html = receiptHtml({
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
    });
    printHtml(html);
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-lg font-bold">Transaksi tersimpan</h1>
        <div className="mt-4 text-xs font-medium text-ink-muted">Kembalian</div>
        <div className="tabular-nums text-4xl font-extrabold text-success">
          {formatRupiah(sale.change_amount)}
        </div>
        <div className="mt-2 text-sm text-ink-muted">Struk {sale.receipt_no}</div>

        <div className="mt-6 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={handleShare}>
            <Share2 size={18} /> Bagikan
          </Button>
          <Button variant="secondary" className="flex-1" onClick={handlePrint}>
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
