"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { Product } from "@/data/schemas";
import { formatRupiah } from "@/domain/money";
import { recordClosingDay } from "@/data/repositories/stock";
import type { ClosingDayItem } from "@/domain/stock";
import { Button } from "@/ui/Button";
import { useToast } from "@/ui/Toast";

interface ClosingWizardProps {
  products: Product[];
  stockMap: Record<string, number>;
  businessDate: string;
  onClose: () => void;
  onDone: () => void;
}

const REASONS = ["Basi", "Rusak", "Dimakan sendiri", "Lainnya"];

export function ClosingWizard({
  products,
  stockMap,
  businessDate,
  onClose,
  onDone,
}: ClosingWizardProps) {
  const { show } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [physical, setPhysical] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const p of products) init[p.id] = stockMap[p.id] ?? 0;
    return init;
  });
  const [reason, setReason] = useState("Basi");
  const [saving, setSaving] = useState(false);

  const items: ClosingDayItem[] = useMemo(
    () =>
      products.map((p) => {
        const systemStock = stockMap[p.id] ?? 0;
        const physicalStock = physical[p.id] ?? 0;
        return {
          productId: p.id,
          systemStock,
          physicalStock,
          difference: physicalStock - systemStock,
          unitCost: p.cost_price,
          reason,
        };
      }),
    [products, stockMap, physical, reason]
  );

  const totalWaste = items
    .filter((i) => i.difference < 0)
    .reduce((acc, i) => acc + Math.abs(i.difference) * i.unitCost, 0);
  const totalAdjust = items
    .filter((i) => i.difference > 0)
    .reduce((acc, i) => acc + i.difference * i.unitCost, 0);

  const largeDifference = items.some(
    (i) => i.systemStock > 0 && Math.abs(i.difference) / i.systemStock > 0.3
  );

  const confirm = async () => {
    setSaving(true);
    try {
      await recordClosingDay(items, businessDate);
      show("Tutup hari tersimpan", { tone: "success" });
      onDone();
    } catch (err) {
      console.error(err);
      show("Gagal menyimpan tutup hari", { tone: "warning" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="flex h-14 items-center gap-2 border-b border-border px-2">
        <button
          onClick={() => (step === 1 ? onClose() : setStep(1))}
          className="hover:bg-primary-soft/50 flex h-11 w-11 items-center justify-center rounded-full"
          aria-label="Kembali"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="text-base font-bold">Tutup hari · Langkah {step}/2</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto w-full max-w-md">
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-ink-muted">
                Masukkan sisa fisik tiap produk. Isian awal = stok sistem.
              </p>
              {products.map((p) => {
                const systemStock = stockMap[p.id] ?? 0;
                const val = physical[p.id] ?? 0;
                const diff = val - systemStock;
                return (
                  <div
                    key={p.id}
                    className="rounded-card border border-border bg-surface p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{p.name}</span>
                      <span className="text-xs text-ink-muted">
                        Sistem: {systemStock}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={val}
                        onChange={(e) =>
                          setPhysical((prev) => ({
                            ...prev,
                            [p.id]: Math.max(0, Number(e.target.value)),
                          }))
                        }
                        className="min-h-[44px] w-24 rounded-btn border border-border bg-surface px-3 text-base tabular-nums"
                      />
                      <span className="text-xs text-ink-muted">pcs sisa</span>
                      <span
                        className={`ml-auto text-sm font-bold tabular-nums ${
                          diff < 0
                            ? "text-danger"
                            : diff > 0
                              ? "text-warning"
                              : "text-success"
                        }`}
                      >
                        {diff > 0 ? "+" : ""}
                        {diff}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="rounded-card border border-border bg-surface p-4">
                <h3 className="mb-2 text-sm font-bold">Ringkasan selisih</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">Nilai waste (kurang)</span>
                  <span className="font-bold tabular-nums text-danger">
                    {formatRupiah(totalWaste)}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-ink-muted">Nilai koreksi (lebih)</span>
                  <span className="font-bold tabular-nums text-warning">
                    {formatRupiah(totalAdjust)}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Alasan selisih</label>
                <div className="flex flex-wrap gap-2">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={[
                        "rounded-full border px-3 py-1.5 text-xs font-semibold",
                        reason === r
                          ? "border-primary bg-primary text-on-primary"
                          : "border-border bg-surface text-ink-muted",
                      ].join(" ")}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {largeDifference && (
                <div className="border-warning/40 bg-warning/10 rounded-btn border p-3 text-xs text-warning">
                  Selisihnya cukup banyak pada sebagian produk. Yakin angkanya benar?
                </div>
              )}

              <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
                {items
                  .filter((i) => i.difference !== 0)
                  .map((i) => {
                    const p = products.find((x) => x.id === i.productId);
                    return (
                      <li
                        key={i.productId}
                        className="flex justify-between px-3 py-2 text-sm"
                      >
                        <span>{p?.name}</span>
                        <span
                          className={`font-bold tabular-nums ${
                            i.difference < 0 ? "text-danger" : "text-warning"
                          }`}
                        >
                          {i.difference > 0 ? "+" : ""}
                          {i.difference}
                        </span>
                      </li>
                    );
                  })}
                {items.every((i) => i.difference === 0) && (
                  <li className="px-3 py-3 text-center text-xs text-ink-muted">
                    Tidak ada selisih. Stok sesuai.
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-surface p-4">
        <div className="mx-auto w-full max-w-md">
          {step === 1 ? (
            <Button size="lg" fullWidth onClick={() => setStep(2)}>
              Lanjut ke ringkasan
            </Button>
          ) : (
            <Button size="lg" fullWidth disabled={saving} onClick={confirm}>
              {saving ? "Menyimpan…" : "Konfirmasi tutup hari"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
