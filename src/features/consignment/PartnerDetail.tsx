"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { listProducts } from "@/data/repositories/products";
import {
  getPartnerStockBalance,
  recordDrop,
  recordSettlement,
  markSettlementPaid,
  getPartnerPrices,
  setPartnerPrice,
  listSettlements,
} from "@/data/repositories/partners";
import type { Partner } from "@/data/schemas";
import { formatRupiah, parseRupiah } from "@/domain/money";
import { getBusinessDate } from "@/lib/date";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { Segmented } from "@/ui/Segmented";
import { Stepper } from "@/ui/Stepper";
import { TextInput, Field } from "@/ui/Field";
import { EmptyState } from "@/ui/EmptyState";
import { Chip } from "@/ui/Chip";
import { useToast } from "@/ui/Toast";

type Tab = "drop" | "settle" | "price";

interface PartnerDetailProps {
  partner: Partner;
  onClose: () => void;
}

export function PartnerDetail({ partner, onClose }: PartnerDetailProps) {
  const [tab, setTab] = useState<Tab>("drop");

  return (
    <Modal open onClose={onClose} title={partner.name}>
      <div className="flex flex-col gap-4">
        <Segmented
          options={[
            { value: "drop", label: "Kirim" },
            { value: "settle", label: "Setoran" },
            { value: "price", label: "Harga" },
          ]}
          value={tab}
          onChange={(v) => setTab(v as Tab)}
        />
        {tab === "drop" && <DropTab partnerId={partner.id} />}
        {tab === "settle" && <SettlementTab partnerId={partner.id} />}
        {tab === "price" && <PriceTab partnerId={partner.id} />}
      </div>
    </Modal>
  );
}

function DropTab({ partnerId }: { partnerId: string }) {
  const products = useLiveQuery(() => listProducts(false), [], []);
  const { show } = useToast();
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const balance = useLiveQuery(
    () => getPartnerStockBalance(partnerId),
    [partnerId],
    {} as Record<string, number>
  );

  const submit = async () => {
    const items = Object.entries(qtys)
      .filter(([, q]) => q > 0)
      .map(([productId, qty]) => ({ productId, qty }));
    if (items.length === 0) {
      show("Isi jumlah yang dikirim", { tone: "warning" });
      return;
    }
    setSaving(true);
    try {
      await recordDrop(partnerId, items, getBusinessDate());
      show("Pengiriman dicatat", { tone: "success" });
      setQtys({});
    } catch (err) {
      console.error(err);
      show("Gagal mencatat pengiriman", { tone: "warning" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-ink-muted">
        Stok berkurang saat dikirim. Sisa di mitra saat ini:{" "}
        {Object.values(balance).reduce((a, b) => a + b, 0)} pcs.
      </p>
      {products.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between rounded-btn border border-border px-3 py-2"
        >
          <div>
            <div className="text-sm font-semibold">{p.name}</div>
            <div className="text-xs text-ink-muted">Sisa: {balance[p.id] ?? 0} pcs</div>
          </div>
          <Stepper
            value={qtys[p.id] ?? 0}
            min={0}
            onChange={(v) => setQtys((prev) => ({ ...prev, [p.id]: v }))}
          />
        </div>
      ))}
      <Button fullWidth disabled={saving} onClick={submit}>
        {saving ? "Menyimpan…" : "Simpan pengiriman"}
      </Button>
    </div>
  );
}

function SettlementTab({ partnerId }: { partnerId: string }) {
  const products = useLiveQuery(() => listProducts(false), [], []);
  const { show } = useToast();
  const balance = useLiveQuery(
    () => getPartnerStockBalance(partnerId),
    [partnerId],
    {} as Record<string, number>
  );
  const prices = useLiveQuery(() => getPartnerPrices(partnerId), [partnerId], []);
  const settlements = useLiveQuery(() => listSettlements(partnerId), [partnerId], []);

  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={() => setOpen(true)}>Buat setoran</Button>

      <div>
        <h3 className="mb-2 text-sm font-bold">Riwayat setoran</h3>
        {settlements.length === 0 ? (
          <EmptyState title="Belum ada setoran" />
        ) : (
          <ul className="flex flex-col gap-2">
            {settlements.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-btn border border-border px-3 py-2"
              >
                <div>
                  <div className="text-sm font-semibold tabular-nums">
                    {formatRupiah(s.total_due)}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {s.period_start} → {s.period_end}
                  </div>
                </div>
                {s.status === "paid" ? (
                  <Chip tone="success">Lunas</Chip>
                ) : (
                  <button
                    onClick={async () => {
                      await markSettlementPaid(s.id);
                      show("Setoran ditandai lunas", { tone: "success" });
                    }}
                    className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary"
                  >
                    Tandai lunas
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Setoran baru">
        <SettlementForm
          partnerId={partnerId}
          products={products}
          balance={balance}
          prices={prices}
          onDone={() => setOpen(false)}
        />
      </Modal>
    </div>
  );
}

function SettlementForm({
  partnerId,
  products,
  balance,
  prices,
  onDone,
}: {
  partnerId: string;
  products: { id: string; name: string; cost_price: number; price: number }[];
  balance: Record<string, number>;
  prices: { product_id: string; price: number }[];
  onDone: () => void;
}) {
  const { show } = useToast();
  const [rows, setRows] = useState<
    Record<string, { sold: number; returned: number; price: number }>
  >({});
  const [saving, setSaving] = useState(false);

  const priceFor = (productId: string) => {
    const pp = prices.find((x) => x.product_id === productId);
    if (pp) return pp.price;
    const prod = products.find((p) => p.id === productId);
    return prod ? Math.round(prod.price * 0.8) : 0;
  };

  const rowFor = (productId: string) =>
    rows[productId] ?? { sold: 0, returned: 0, price: priceFor(productId) };

  const total = Object.entries(rows).reduce((acc, [, r]) => acc + r.sold * r.price, 0);

  const submit = async () => {
    const items = Object.entries(rows)
      .filter(([, r]) => r.sold > 0 || r.returned > 0)
      .map(([productId, r]) => ({
        productId,
        soldQty: r.sold,
        returnedQty: r.returned,
        unitPrice: r.price,
      }));
    if (items.length === 0) {
      show("Isi qty terjual atau retur", { tone: "warning" });
      return;
    }
    setSaving(true);
    try {
      const today = getBusinessDate();
      await recordSettlement(partnerId, today, today, items);
      show("Setoran dicatat", { tone: "success" });
      onDone();
    } catch (err) {
      console.error(err);
      show("Gagal menyimpan setoran", { tone: "warning" });
    } finally {
      setSaving(false);
    }
  };

  const candidates = products.filter((p) => (balance[p.id] ?? 0) > 0 || rows[p.id]);

  return (
    <div className="flex flex-col gap-3">
      {candidates.length === 0 ? (
        <EmptyState title="Belum ada titipan" description="Kirim produk ke mitra dulu." />
      ) : (
        candidates.map((p) => {
          const r = rowFor(p.id);
          return (
            <div key={p.id} className="rounded-btn border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{p.name}</span>
                <span className="text-xs text-ink-muted">Sisa: {balance[p.id] ?? 0}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-xs">
                  Terjual
                  <TextInput
                    inputMode="numeric"
                    value={r.sold || ""}
                    onChange={(e) =>
                      setRows((prev) => ({
                        ...prev,
                        [p.id]: { ...r, sold: Number(e.target.value) || 0 },
                      }))
                    }
                    className="mt-1"
                  />
                </label>
                <label className="text-xs">
                  Retur
                  <TextInput
                    inputMode="numeric"
                    value={r.returned || ""}
                    onChange={(e) =>
                      setRows((prev) => ({
                        ...prev,
                        [p.id]: { ...r, returned: Number(e.target.value) || 0 },
                      }))
                    }
                    className="mt-1"
                  />
                </label>
              </div>
              <label className="mt-2 block text-xs">
                Harga setoran / pcs
                <TextInput
                  inputMode="numeric"
                  value={r.price || ""}
                  onChange={(e) =>
                    setRows((prev) => ({
                      ...prev,
                      [p.id]: { ...r, price: parseRupiah(e.target.value) },
                    }))
                  }
                  className="mt-1"
                />
              </label>
            </div>
          );
        })
      )}

      <div className="bg-primary-soft/50 rounded-card p-3 text-base font-bold">
        <div className="flex justify-between">
          <span>Tagihan</span>
          <span className="tabular-nums">{formatRupiah(total)}</span>
        </div>
      </div>

      <Button fullWidth disabled={saving || candidates.length === 0} onClick={submit}>
        {saving ? "Menyimpan…" : "Simpan setoran"}
      </Button>
    </div>
  );
}

function PriceTab({ partnerId }: { partnerId: string }) {
  const products = useLiveQuery(() => listProducts(false), [], []);
  const prices = useLiveQuery(() => getPartnerPrices(partnerId), [partnerId], []);
  const { show } = useToast();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-ink-muted">
        Harga untuk mitra (biasanya di bawah harga jual).
      </p>
      {products.map((p) => {
        const current = prices.find((x) => x.product_id === p.id)?.price ?? "";
        return (
          <div
            key={p.id}
            className="flex items-center justify-between gap-2 rounded-btn border border-border px-3 py-2"
          >
            <div>
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="text-xs text-ink-muted">Jual {formatRupiah(p.price)}</div>
            </div>
            <TextInput
              inputMode="numeric"
              defaultValue={current === "" ? "" : String(current)}
              placeholder="0"
              className="w-28"
              onBlur={async (e) => {
                const price = parseRupiah(e.target.value);
                await setPartnerPrice(partnerId, p.id, price);
                show("Harga disimpan", { tone: "success" });
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
