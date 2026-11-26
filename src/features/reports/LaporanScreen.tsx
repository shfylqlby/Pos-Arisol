"use client";

import React, { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Download, Receipt, FileText } from "lucide-react";
import type { Sale, SaleItem } from "@/data/schemas";
import { computeReport } from "@/domain/reports";
import { formatRupiah } from "@/domain/money";
import { getBusinessDate, formatDateTime } from "@/lib/date";
import { getSettings } from "@/data/repositories/settings";
import { getReportData, getDailyOmzet } from "@/data/repositories/reports";
import { getSaleWithDetails } from "@/data/repositories/sales";
import { getConsignmentRevenue } from "@/data/repositories/partners";
import { StatCard } from "@/ui/StatCard";
import { EmptyState } from "@/ui/EmptyState";
import { Chip } from "@/ui/Chip";
import { toCsv, downloadCsv } from "@/lib/csv";
import { TransactionDetail } from "./TransactionDetail";

type Period = "today" | "yesterday" | "7d" | "month" | "custom";

function dateRange(period: Period, tz: string, customStart?: string, customEnd?: string) {
  const now = new Date();
  const today = getBusinessDate(now, tz);
  const minus = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return getBusinessDate(d, tz);
  };

  switch (period) {
    case "today":
      return { start: today, end: today };
    case "yesterday":
      return { start: minus(1), end: minus(1) };
    case "7d":
      return { start: minus(6), end: today };
    case "month": {
      const d = new Date(now);
      const first = new Date(d.getFullYear(), d.getMonth(), 1);
      return { start: getBusinessDate(first, tz), end: today };
    }
    case "custom":
      return { start: customStart || today, end: customEnd || today };
  }
}

export function LaporanScreen() {
  const settings = useLiveQuery(() => getSettings(), [], undefined);
  const tz = settings?.timezone || "Asia/Jakarta";
  const [period, setPeriod] = useState<Period>("today");
  const [customStart, setCustomStart] = useState(getBusinessDate());
  const [customEnd, setCustomEnd] = useState(getBusinessDate());
  const [selectedSale, setSelectedSale] = useState<{
    sale: Sale;
    items: SaleItem[];
    isVoid: boolean;
  } | null>(null);

  const range = dateRange(period, tz, customStart, customEnd);

  const data = useLiveQuery(
    () => getReportData(range.start, range.end),
    [range.start, range.end],
    undefined
  );

  const dailySeries = useLiveQuery(
    () => getDailyOmzet(range.start, range.end),
    [range.start, range.end],
    []
  );

  const consignment = useLiveQuery(
    () => getConsignmentRevenue(range.start, range.end, tz),
    [range.start, range.end, tz],
    undefined
  );

  const report = useMemo(() => {
    if (!data) return null;
    return computeReport(data.sales, data.saleItems, data.voidSaleIds, data.waste);
  }, [data]);

  const exportTransactions = () => {
    if (!data) return;
    const rows = data.sales.map((s) => ({
      receipt_no: s.receipt_no,
      business_date: s.business_date,
      created_at: s.created_at,
      subtotal: s.subtotal,
      discount: s.discount,
      total: s.total,
      payment_method: s.payment_method,
      status: data.voidSaleIds.has(s.id) ? "VOID" : "OK",
    }));
    downloadCsv(`transaksi-${range.start}_${range.end}.csv`, toCsv(rows));
  };

  const exportSummary = () => {
    if (!report) return;
    const rows = [
      { metric: "Omzet", value: report.summary.omzet },
      { metric: "Modal", value: report.summary.modal },
      { metric: "Untung", value: report.summary.untung },
      { metric: "Transaksi", value: report.summary.transactionCount },
      { metric: "Rata-rata", value: report.summary.averagePerTransaction },
      { metric: "Waste", value: report.summary.wasteCost },
    ];
    downloadCsv(`ringkasan-${range.start}_${range.end}.csv`, toCsv(rows));
  };

  const maxDaily = Math.max(1, ...dailySeries.map((d) => d.total));
  const showChart = dailySeries.length >= 7;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-extrabold">Laporan</h1>
        <div className="flex gap-1">
          <button
            onClick={exportTransactions}
            className="flex items-center gap-1 rounded-btn border border-border px-2 py-1.5 text-xs font-semibold"
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={exportSummary}
            className="flex items-center gap-1 rounded-btn border border-border px-2 py-1.5 text-xs font-semibold"
          >
            <FileText size={14} /> Ringkasan
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {(
          [
            ["today", "Hari ini"],
            ["yesterday", "Kemarin"],
            ["7d", "7 hari"],
            ["month", "Bulan ini"],
            ["custom", "Kustom"],
          ] as [Period, string][]
        ).map(([p, label]) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-semibold",
              period === p
                ? "border-primary bg-primary text-on-primary"
                : "border-border bg-surface text-ink-muted",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="mb-3 flex items-center gap-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="min-h-[40px] flex-1 rounded-btn border border-border bg-surface px-2 text-sm"
          />
          <span className="text-xs text-ink-muted">s/d</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="min-h-[40px] flex-1 rounded-btn border border-border bg-surface px-2 text-sm"
          />
        </div>
      )}

      {!report ? (
        <div className="bg-border/40 h-40 animate-pulse rounded-card" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            <StatCard label="Omzet" value={formatRupiah(report.summary.omzet)} />
            <StatCard label="Modal" value={formatRupiah(report.summary.modal)} />
            <StatCard
              label="Untung"
              value={formatRupiah(report.summary.untung)}
              tone={report.summary.untung >= 0 ? "success" : "danger"}
            />
            <StatCard label="Transaksi" value={report.summary.transactionCount} />
            <StatCard
              label="Rata-rata"
              value={formatRupiah(report.summary.averagePerTransaction)}
            />
            <StatCard
              label="Waste"
              value={formatRupiah(report.summary.wasteCost)}
              tone="warning"
            />
          </div>

          <div className="rounded-card border border-border bg-surface p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">
                Titip jual lunas ({consignment?.count ?? 0} setoran)
              </span>
              <span className="font-semibold tabular-nums">
                {formatRupiah(consignment?.total ?? 0)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-border pt-1 font-bold">
              <span>Total kas + titip jual</span>
              <span className="tabular-nums">
                {formatRupiah(report.summary.omzet + (consignment?.total ?? 0))}
              </span>
            </div>
          </div>

          {showChart && (
            <div className="rounded-card border border-border bg-surface p-3">
              <h3 className="mb-2 text-sm font-bold">Omzet per hari</h3>
              <div className="flex h-32 items-end gap-1">
                {dailySeries.map((d) => (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="bg-primary/80 w-full rounded-t"
                      style={{ height: `${Math.max(2, (d.total / maxDaily) * 100)}%` }}
                      title={formatRupiah(d.total)}
                    />
                    <span className="text-[9px] text-ink-muted">{d.date.slice(8)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-card border border-border bg-surface p-3">
              <h3 className="mb-2 text-sm font-bold">Menu terlaris</h3>
              {report.bestSellers.length === 0 ? (
                <p className="text-xs text-ink-muted">Belum ada penjualan.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {report.bestSellers.slice(0, 5).map((b, idx) => (
                    <li key={b.productId} className="flex items-center gap-2 text-sm">
                      <span className="w-4 text-xs font-bold text-ink-muted">
                        {idx + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{b.productName}</span>
                      <span className="text-xs tabular-nums text-ink-muted">
                        {b.qty} pcs
                      </span>
                      <span className="text-xs font-semibold tabular-nums">
                        {formatRupiah(b.totalOmzet)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-card border border-border bg-surface p-3">
              <h3 className="mb-2 text-sm font-bold">Metode bayar</h3>
              <ul className="flex flex-col gap-1.5 text-sm">
                <li className="flex justify-between">
                  <span className="text-ink-muted">Tunai</span>
                  <span className="tabular-nums">
                    {formatRupiah(report.paymentBreakdown.cash)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-ink-muted">QRIS</span>
                  <span className="tabular-nums">
                    {formatRupiah(report.paymentBreakdown.qris)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-ink-muted">Transfer</span>
                  <span className="tabular-nums">
                    {formatRupiah(report.paymentBreakdown.transfer)}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold">Transaksi</h3>
            {data && data.sales.length === 0 ? (
              <EmptyState icon={<Receipt size={36} />} title="Belum ada transaksi" />
            ) : (
              <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
                {data?.sales
                  .slice()
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))
                  .map((s) => {
                    const isVoid = data.voidSaleIds.has(s.id);
                    return (
                      <li key={s.id}>
                        <button
                          onClick={async () => {
                            const detail = await getSaleWithDetails(s.id);
                            if (detail) {
                              setSelectedSale({
                                sale: detail.sale,
                                items: detail.items,
                                isVoid: Boolean(detail.voidRecord),
                              });
                            }
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">
                                {s.receipt_no}
                              </span>
                              {isVoid && <Chip tone="danger">Void</Chip>}
                            </div>
                            <div className="text-xs text-ink-muted">
                              {formatDateTime(s.created_at, tz)}
                            </div>
                          </div>
                          <span className="text-sm font-bold tabular-nums">
                            {formatRupiah(s.total)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </div>
      )}

      {selectedSale && (
        <TransactionDetail
          sale={selectedSale.sale}
          items={selectedSale.items}
          isVoid={selectedSale.isVoid}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
}
