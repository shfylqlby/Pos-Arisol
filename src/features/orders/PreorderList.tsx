"use client";

import React, { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, CalendarClock } from "lucide-react";
import { listPreorders } from "@/data/repositories/preorders";
import type { Preorder, PreorderItem, PreorderStatus } from "@/data/schemas";
import { formatRupiah } from "@/domain/money";
import { formatDateTime } from "@/lib/date";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { EmptyState } from "@/ui/EmptyState";
import { Modal } from "@/ui/Modal";
import { PreorderForm } from "./PreorderForm";
import { PreorderDetail } from "./PreorderDetail";

const statusMeta: Record<PreorderStatus, { label: string; tone: "default" | "success" | "warning" | "danger" | "primary" }> = {
  new: { label: "Baru", tone: "primary" },
  in_production: { label: "Diproduksi", tone: "warning" },
  ready: { label: "Siap", tone: "success" },
  done: { label: "Selesai", tone: "default" },
  cancelled: { label: "Dibatalkan", tone: "danger" },
};

export function PreorderList() {
  const preorders = useLiveQuery(() => listPreorders(), [], undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<{ preorder: Preorder; items: PreorderItem[] } | null>(null);

  const grouped = useMemo(() => {
    if (!preorders) return null;
    const today = new Date();
    const todayKey = today.toDateString();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = tomorrow.toDateString();

    const groups: Record<string, { preorder: Preorder; items: PreorderItem[] }[]> = {
      "Hari ini": [],
      Besok: [],
      Mendatang: [],
      Selesai: [],
    };

    for (const entry of preorders) {
      const p = entry.preorder;
      if (p.status === "done" || p.status === "cancelled") {
        groups["Selesai"].push(entry);
        continue;
      }
      const d = new Date(p.pickup_at);
      const key = d.toDateString();
      if (key === todayKey) groups["Hari ini"].push(entry);
      else if (key === tomorrowKey) groups["Besok"].push(entry);
      else groups["Mendatang"].push(entry);
    }
    return groups;
  }, [preorders]);

  const needs = useMemo(() => {
    if (!preorders) return [];
    const byDate: Record<string, { label: string; ts: number; items: Record<string, number> }> = {};
    for (const entry of preorders) {
      const p = entry.preorder;
      if (p.status === "done" || p.status === "cancelled") continue;
      const pickup = new Date(p.pickup_at);
      const key = pickup.toDateString();
      if (!byDate[key]) {
        byDate[key] = {
          label: pickup.toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }),
          ts: pickup.getTime(),
          items: {},
        };
      }
      for (const item of entry.items) {
        byDate[key].items[item.product_name] =
          (byDate[key].items[item.product_name] || 0) + item.qty;
      }
    }
    return Object.values(byDate).sort((a, b) => a.ts - b.ts);
  }, [preorders]);

  if (preorders === undefined) {
    return <div className="h-40 animate-pulse rounded-card bg-border/40" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Pre-order</h2>
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={18} /> Pesanan baru
        </Button>
      </div>

      {needs.length > 0 && (
        <div className="rounded-card border border-border bg-surface p-3">
          <h3 className="mb-2 text-sm font-bold">Kebutuhan produksi</h3>
          <ul className="flex flex-col gap-2">
            {needs.map((n) => (
              <li key={n.label} className="text-xs">
                <span className="font-semibold text-ink">{n.label}</span>
                <span className="text-ink-muted">
                  {" — "}
                  {Object.entries(n.items)
                    .map(([name, qty]) => `${name} ×${qty}`)
                    .join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {preorders.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={40} />}
          title="Belum ada pesanan"
          description="Catat pesanan acara atau arisan supaya tidak terlewat."
          action={<Button onClick={() => setFormOpen(true)}>Buat pesanan</Button>}
        />
      ) : (
        grouped &&
        Object.entries(grouped).map(([label, list]) =>
          list.length === 0 ? null : (
            <div key={label} className="flex flex-col gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                {label}
              </h3>
              {list.map((entry) => {
                const meta = statusMeta[entry.preorder.status];
                const remaining = entry.preorder.total - entry.preorder.deposit;
                return (
                  <button
                    key={entry.preorder.id}
                    onClick={() => setSelected(entry)}
                    className="flex flex-col gap-1 rounded-card border border-border bg-surface p-3 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{entry.preorder.customer_name}</span>
                      <Chip tone={meta.tone}>{meta.label}</Chip>
                    </div>
                    <div className="text-xs text-ink-muted">
                      Ambil: {formatDateTime(entry.preorder.pickup_at)}
                    </div>
                    <div className="text-xs text-ink-muted">
                      {entry.items.map((i) => `${i.product_name} x${i.qty}`).join(", ")}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="tabular-nums font-semibold">
                        {formatRupiah(entry.preorder.total)}
                      </span>
                      {remaining > 0 && entry.preorder.status !== "done" && (
                        <span className="text-xs text-warning">
                          Sisa bayar {formatRupiah(remaining)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )
        )
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Pesanan baru">
        <PreorderForm
          onDone={() => setFormOpen(false)}
        />
      </Modal>

      {selected && (
        <PreorderDetail
          preorder={selected.preorder}
          items={selected.items}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
