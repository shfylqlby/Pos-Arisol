"use client";

import React, { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { PackagePlus, Moon, History, Boxes } from "lucide-react";
import { listProducts } from "@/data/repositories/products";
import { getAllProductsStock, listMovements, listMovementsByDate, recordProduction, recordStockMovement } from "@/data/repositories/stock";
import { getDayOmzet } from "@/data/repositories/sales";
import type { Product } from "@/data/schemas";
import { getBusinessDate, formatDateTime } from "@/lib/date";
import { formatRupiah } from "@/domain/money";
import { getStockStatus, calculateStockSummary } from "@/domain/stock";
import { getSettings } from "@/data/repositories/settings";
import { Segmented } from "@/ui/Segmented";
import { EmptyState } from "@/ui/EmptyState";
import { Button } from "@/ui/Button";
import { StatCard } from "@/ui/StatCard";
import { Chip } from "@/ui/Chip";
import { useToast } from "@/ui/Toast";
import { ClosingWizard } from "./ClosingWizard";

type Tab = "today" | "production" | "history";

const typeLabel: Record<string, string> = {
  production: "Produksi",
  sale: "Terjual",
  sale_void: "Void",
  waste: "Waste",
  adjustment: "Koreksi",
  consignment_out: "Titip keluar",
  consignment_return: "Titip retur",
};

export function StokScreen() {
  const [tab, setTab] = useState<Tab>("today");
  const settings = useLiveQuery(() => getSettings(), [], undefined);
  const businessDate = getBusinessDate(new Date(), settings?.timezone || "Asia/Jakarta");

  const products = useLiveQuery(() => listProducts(true), [], undefined as Product[] | undefined);
  const stockMap = useLiveQuery(() => getAllProductsStock(), [], {} as Record<string, number>);
  const todayMovements = useLiveQuery(
    () => listMovementsByDate(businessDate),
    [businessDate],
    []
  );

  const { show } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);

  const summaries = useMemo(() => {
    const map: Record<string, ReturnType<typeof calculateStockSummary>> = {};
    if (!products) return map;
    for (const p of products) {
      if (!p.track_stock) continue;
      const moves = todayMovements
        .filter((m) => m.product_id === p.id)
        .map((m) => ({
          product_id: m.product_id,
          qty: m.qty,
          type: m.type,
          unit_cost: m.unit_cost,
          business_date: m.business_date,
        }));
      // currentStock from full ledger, others from today's moves
      const todaySummary = calculateStockSummary(moves, businessDate);
      map[p.id] = {
        currentStock: stockMap[p.id] ?? 0,
        producedToday: todaySummary.producedToday,
        soldToday: todaySummary.soldToday,
        wasteToday: todaySummary.wasteToday,
      };
    }
    return map;
  }, [products, todayMovements, businessDate, stockMap]);

  const totalOmzetToday = useLiveQuery(async () => {
    return getDayOmzet(businessDate);
  }, [businessDate], 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-extrabold">Stok</h1>
        <Segmented
          options={[
            { value: "today", label: "Hari ini" },
            { value: "production", label: "Produksi" },
            { value: "history", label: "Riwayat" },
          ]}
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          className="max-w-xs"
        />
      </div>

      {tab === "today" && (
        <TodayTab
          products={products}
          summaries={summaries}
          omzet={totalOmzetToday}
          onCloseDay={() => setWizardOpen(true)}
        />
      )}

      {tab === "production" && (
        <ProductionTab products={products} businessDate={businessDate} />
      )}

      {tab === "history" && <HistoryTab products={products} />}

      {wizardOpen && products && (
        <ClosingWizard
          products={products.filter((p) => p.track_stock)}
          stockMap={stockMap}
          businessDate={businessDate}
          onClose={() => setWizardOpen(false)}
          onDone={() => {
            setWizardOpen(false);
            show("Hari ditutup. Selisih tercatat.", { tone: "success" });
          }}
        />
      )}
    </div>
  );
}

function TodayTab({
  products,
  summaries,
  omzet,
  onCloseDay,
}: {
  products: Product[] | undefined;
  summaries: Record<string, ReturnType<typeof calculateStockSummary>>;
  omzet: number;
  onCloseDay: () => void;
}) {
  if (products === undefined) {
    return <div className="h-40 animate-pulse rounded-card bg-border/40" />;
  }
  const tracked = products.filter((p) => p.track_stock);
  if (tracked.length === 0) {
    return <EmptyState icon={<Boxes size={40} />} title="Belum ada produk berstok" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Omzet hari ini" value={formatRupiah(omzet)} />
        <StatCard
          label="Total terjual"
          value={`${Object.values(summaries).reduce((a, s) => a + s.soldToday, 0)} pcs`}
        />
      </div>

      <ul className="flex flex-col gap-2">
        {tracked.map((p) => {
          const s = summaries[p.id] || {
            currentStock: 0,
            producedToday: 0,
            soldToday: 0,
            wasteToday: 0,
          };
          const status = getStockStatus(s.currentStock, p.low_stock_threshold ?? 10);
          const border =
            status.status === "out_of_stock"
              ? "border-l-danger"
              : status.status === "low_stock"
              ? "border-l-warning"
              : "border-l-success";
          return (
            <li
              key={p.id}
              className={`flex items-center justify-between rounded-card border border-border border-l-4 bg-surface p-3 ${border}`}
            >
              <div>
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="text-xs text-ink-muted">
                  Produksi {s.producedToday} · Terjual {s.soldToday}
                  {s.wasteToday > 0 ? ` · Waste ${s.wasteToday}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="tabular-nums text-2xl font-extrabold">{s.currentStock}</div>
                <div className="text-[10px] text-ink-muted">pcs</div>
              </div>
            </li>
          );
        })}
      </ul>

      <Button size="lg" fullWidth onClick={onCloseDay} className="mt-2">
        <Moon size={18} /> Tutup hari
      </Button>
    </div>
  );
}

function ProductionTab({ products, businessDate }: { products: Product[] | undefined; businessDate: string }) {
  const { show } = useToast();
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(0);
  const [saving, setSaving] = useState(false);

  const todayProduction = useLiveQuery(
    async () => {
      const moves = await listMovementsByDate(businessDate);
      return moves.filter((m) => m.type === "production").sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    [businessDate],
    []
  );

  const tracked = (products || []).filter((p) => p.track_stock);
  const selected = tracked.find((p) => p.id === productId);

  const save = async () => {
    if (!selected || qty <= 0) return;
    setSaving(true);
    try {
      await recordProduction(selected.id, qty, selected.cost_price, businessDate);
      show(`Produksi ${selected.name} +${qty}`, { tone: "success" });
      setQty(0);
    } catch (err) {
      console.error(err);
      show("Gagal menyimpan produksi", { tone: "warning" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-border bg-surface p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <PackagePlus size={18} /> Catat produksi
        </h2>
        <div className="flex flex-col gap-3">
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="min-h-[48px] w-full rounded-btn border border-border bg-surface px-3 text-base"
          >
            <option value="">Pilih produk…</option>
            {tracked.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={qty || ""}
              onChange={(e) => setQty(Number(e.target.value))}
              placeholder="Jumlah"
              className="tabular-nums min-h-[48px] w-24 rounded-btn border border-border bg-surface px-3 text-base"
            />
            {[5, 10, 20].map((n) => (
              <button
                key={n}
                onClick={() => setQty((q) => q + n)}
                className="min-h-[48px] flex-1 rounded-btn border border-border bg-surface text-sm font-semibold"
              >
                +{n}
              </button>
            ))}
          </div>

          <Button fullWidth disabled={!selected || qty <= 0 || saving} onClick={save}>
            {saving ? "Menyimpan…" : "Simpan produksi"}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold">Produksi hari ini</h3>
        {todayProduction.length === 0 ? (
          <EmptyState title="Belum ada produksi" description="Catat produksi pertamamu hari ini." />
        ) : (
          <ul className="flex flex-col gap-2">
            {todayProduction.map((m) => {
              const p = (products || []).find((x) => x.id === m.product_id);
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-btn border border-border bg-surface px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-semibold">{p?.name || m.product_id}</div>
                    <div className="text-xs text-ink-muted">{formatDateTime(m.created_at)}</div>
                  </div>
                  <Chip tone="success">+{m.qty} pcs</Chip>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function HistoryTab({ products }: { products: Product[] | undefined }) {
  const [productId, setProductId] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const movements = useLiveQuery(
    () => listMovements(productId || undefined, 200),
    [productId],
    []
  );

  const filtered = movements.filter((m) => typeFilter === "all" || m.type === typeFilter);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="min-h-[44px] flex-1 rounded-btn border border-border bg-surface px-3 text-sm"
        >
          <option value="">Semua produk</option>
          {(products || []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="min-h-[44px] rounded-btn border border-border bg-surface px-3 text-sm"
        >
          <option value="all">Semua tipe</option>
          {Object.entries(typeLabel).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<History size={36} />} title="Belum ada riwayat" />
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
          {filtered.map((m) => {
            const p = (products || []).find((x) => x.id === m.product_id);
            return (
              <li key={m.id} className="flex items-center justify-between px-3 py-2">
                <div>
                  <div className="text-sm font-semibold">{p?.name || m.product_id}</div>
                  <div className="text-xs text-ink-muted">
                    {typeLabel[m.type] || m.type} · {formatDateTime(m.created_at)}
                    {m.note ? ` · ${m.note}` : ""}
                  </div>
                </div>
                <span
                  className={`tabular-nums text-sm font-bold ${
                    m.qty >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {m.qty > 0 ? "+" : ""}
                  {m.qty}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
