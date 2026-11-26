"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft, QrCode } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { getSettings } from "@/data/repositories/settings";
import { useCartStore } from "./useCartStore";
import { calculateCartTotals } from "@/domain/cart";
import { calculateChange, formatRupiah } from "@/domain/money";
import { createSale } from "@/data/repositories/sales";
import type { PaymentMethod, Sale, SaleItem } from "@/data/schemas";
import { Button } from "@/ui/Button";
import { Segmented } from "@/ui/Segmented";
import { QuickCashGrid } from "@/ui/QuickCashGrid";
import { MoneyKeypad } from "@/ui/MoneyKeypad";
import { BottomSheet } from "@/ui/BottomSheet";
import { useToast } from "@/ui/Toast";

interface PaymentScreenProps {
  onBack: () => void;
  onSuccess: (sale: Sale, items: SaleItem[]) => void;
}

export function PaymentScreen({ onBack, onSuccess }: PaymentScreenProps) {
  const { items, discount, clear } = useCartStore();
  const settings = useLiveQuery(() => getSettings(), [], undefined);
  const { show } = useToast();

  const totals = calculateCartTotals({ items, discount });
  const totalDue = totals.total;

  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paid, setPaid] = useState(0);
  const [showKeypad, setShowKeypad] = useState(false);
  const [saving, setSaving] = useState(false);

  const change = calculateChange(paid, totalDue);
  const canFinish = method !== "cash" || paid >= totalDue;

  const qrisImage = settings?.qris_image ?? null;

  const handleFinish = async () => {
    if (saving) return;
    if (items.length === 0) return;
    setSaving(true);
    try {
      const effectivePaid = method === "cash" ? paid : totalDue;
      const effectiveChange = method === "cash" ? change : 0;
      const result = await createSale({
        cart: { items, discount },
        paymentMethod: method,
        paidAmount: effectivePaid,
        changeAmount: effectiveChange,
      });
      clear();
      onSuccess(result.sale, result.items);
    } catch (err) {
      console.error(err);
      show("Gagal menyimpan transaksi. Coba lagi.", { tone: "warning" });
    } finally {
      setSaving(false);
    }
  };

  const paymentLabel = useMemo(
    () => (method === "cash" ? "Tunai" : method === "qris" ? "QRIS" : "Transfer"),
    [method]
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="flex h-14 items-center gap-2 border-b border-border px-2">
        <button
          onClick={onBack}
          className="hover:bg-primary-soft/50 flex h-11 w-11 items-center justify-center rounded-full"
          aria-label="Kembali"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="text-base font-bold">Bayar</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-4 text-center">
            <div className="text-xs font-medium text-ink-muted">Total</div>
            <div className="text-4xl font-extrabold tabular-nums text-ink">
              {formatRupiah(totalDue)}
            </div>
          </div>

          <Segmented
            options={[
              { value: "cash", label: "Tunai" },
              { value: "qris", label: "QRIS" },
              { value: "transfer", label: "Transfer" },
            ]}
            value={method}
            onChange={(v) => {
              setMethod(v as PaymentMethod);
              setPaid(0);
            }}
            className="mb-4"
          />

          {method === "cash" && (
            <div className="flex flex-col gap-3">
              <QuickCashGrid
                totalDue={totalDue}
                onSelect={(amount) => setPaid(amount)}
                onManual={() => setShowKeypad(true)}
              />
              <div className="mt-2 flex justify-between rounded-card border border-border bg-surface p-3">
                <span className="text-sm text-ink-muted">Diterima</span>
                <span className="text-base font-bold tabular-nums">
                  {formatRupiah(paid)}
                </span>
              </div>
              <div className="border-success/30 bg-success/5 flex justify-between rounded-card border p-3">
                <span className="text-sm font-semibold text-success">Kembalian</span>
                <span className="text-xl font-extrabold tabular-nums text-success">
                  {formatRupiah(change)}
                </span>
              </div>
            </div>
          )}

          {method === "qris" && (
            <div className="flex flex-col items-center gap-3">
              {qrisImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrisImage}
                  alt="QRIS"
                  className="h-64 w-64 rounded-card border border-border bg-white object-contain p-2"
                />
              ) : (
                <div className="flex h-56 w-56 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border text-ink-muted">
                  <QrCode size={40} />
                  <span className="px-4 text-center text-xs">
                    Gambar QRIS belum diatur. Atur di Pengaturan.
                  </span>
                </div>
              )}
              <p className="text-center text-xs text-ink-muted">
                Minta pelanggan scan QR, lalu ketuk tombol di bawah setelah dibayar.
              </p>
            </div>
          )}

          {method === "transfer" && (
            <div className="rounded-card border border-border bg-surface p-4 text-sm">
              <p className="mb-2 font-semibold">Transfer bank</p>
              <p className="text-ink-muted">
                Konfirmasi manual setelah dana masuk ke rekening.
              </p>
              <p className="mt-2 text-xs text-ink-muted">
                Atur info rekening di Pengaturan.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-surface p-4">
        <div className="mx-auto w-full max-w-md">
          <Button
            size="lg"
            fullWidth
            disabled={!canFinish || saving}
            onClick={handleFinish}
          >
            {saving ? "Menyimpan…" : `SELESAI (${paymentLabel})`}
          </Button>
        </div>
      </div>

      <BottomSheet
        open={showKeypad}
        onClose={() => setShowKeypad(false)}
        title="Uang diterima"
      >
        <MoneyKeypad
          initial={paid}
          onSubmit={(amount) => {
            setPaid(amount);
            setShowKeypad(false);
          }}
          onCancel={() => setShowKeypad(false)}
        />
      </BottomSheet>
    </div>
  );
}
