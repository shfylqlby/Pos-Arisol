"use client";

import React, { useState } from "react";
import { MessageCircle, CheckCircle2, Factory, PackageCheck } from "lucide-react";
import type { Preorder, PreorderItem, PreorderStatus, PaymentMethod } from "@/data/schemas";
import { formatRupiah } from "@/domain/money";
import { formatDateTime } from "@/lib/date";
import { updatePreorderStatus, completePreorder } from "@/data/repositories/preorders";
import { Modal } from "@/ui/Modal";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { Segmented } from "@/ui/Segmented";
import { TextInput } from "@/ui/Field";
import { useToast } from "@/ui/Toast";

interface PreorderDetailProps {
  preorder: Preorder;
  items: PreorderItem[];
  onClose: () => void;
}

const statusLabel: Record<PreorderStatus, string> = {
  new: "Baru",
  in_production: "Diproduksi",
  ready: "Siap",
  done: "Selesai",
  cancelled: "Dibatalkan",
};

export function PreorderDetail({ preorder, items, onClose }: PreorderDetailProps) {
  const { show } = useToast();
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paidText, setPaidText] = useState("");
  const [saving, setSaving] = useState(false);

  const remaining = Math.max(0, preorder.total - preorder.deposit);

  const sendWa = () => {
    const text = `Halo ${preorder.customer_name}, pesanan Anda (${items
      .map((i) => `${i.product_name} x${i.qty}`)
      .join(", ")}) dijadwalkan ${formatDateTime(preorder.pickup_at)}. Total ${formatRupiah(
      preorder.total
    )}. Terima kasih!`;
    const phone = preorder.phone.replace(/[^0-9]/g, "").replace(/^0/, "62");
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const advance = async (status: PreorderStatus) => {
    try {
      await updatePreorderStatus(preorder.id, status);
      show(`Status: ${statusLabel[status]}`, { tone: "success" });
      onClose();
    } catch (err) {
      console.error(err);
      show("Gagal mengubah status", { tone: "warning" });
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      const paid = method === "cash" ? Number(paidText.replace(/[^0-9]/g, "")) || remaining : remaining;
      const change = method === "cash" ? Math.max(0, paid - remaining) : 0;
      await completePreorder(preorder.id, method, paid, change);
      show("Pesanan selesai & tercatat", { tone: "success" });
      setPayOpen(false);
      onClose();
    } catch (err) {
      console.error(err);
      show("Gagal menyelesaikan pesanan", { tone: "warning" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal open onClose={onClose} title="Detail pesanan">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-bold">{preorder.customer_name}</div>
              <div className="text-xs text-ink-muted">{preorder.phone || "-"}</div>
            </div>
            <Chip tone={preorder.status === "done" ? "default" : "primary"}>
              {statusLabel[preorder.status]}
            </Chip>
          </div>

          <div className="rounded-card border border-border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Ambil</span>
              <span>{formatDateTime(preorder.pickup_at)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-ink-muted">Total</span>
              <span className="tabular-nums font-bold">{formatRupiah(preorder.total)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-ink-muted">DP</span>
              <span className="tabular-nums">{formatRupiah(preorder.deposit)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-ink-muted">Sisa bayar</span>
              <span className="tabular-nums font-bold text-warning">
                {formatRupiah(remaining)}
              </span>
            </div>
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

          {preorder.note && (
            <p className="text-xs text-ink-muted">Catatan: {preorder.note}</p>
          )}

          <div className="flex flex-col gap-2">
            {preorder.status === "new" && (
              <Button onClick={() => advance("in_production")}>
                <Factory size={18} /> Mulai produksi
              </Button>
            )}
            {preorder.status === "in_production" && (
              <Button onClick={() => advance("ready")}>
                <PackageCheck size={18} /> Tandai siap
              </Button>
            )}
            {preorder.status === "ready" && (
              <Button onClick={() => setPayOpen(true)}>
                <CheckCircle2 size={18} /> Selesaikan & bayar
              </Button>
            )}
            <Button variant="secondary" onClick={sendWa}>
              <MessageCircle size={18} /> Kirim WhatsApp
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Selesaikan pesanan"
        footer={
          <Button fullWidth size="lg" disabled={saving} onClick={finish}>
            {saving ? "Menyimpan…" : "Selesai & catat penjualan"}
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex justify-between text-base font-bold">
            <span>Sisa bayar</span>
            <span className="tabular-nums">{formatRupiah(remaining)}</span>
          </div>
          <Segmented
            options={[
              { value: "cash", label: "Tunai" },
              { value: "qris", label: "QRIS" },
              { value: "transfer", label: "Transfer" },
            ]}
            value={method}
            onChange={(v) => setMethod(v as PaymentMethod)}
          />
          {method === "cash" && (
            <div>
              <label className="mb-1 block text-sm font-semibold">Uang diterima</label>
              <TextInput
                inputMode="numeric"
                value={paidText}
                onChange={(e) => setPaidText(e.target.value)}
                placeholder={String(remaining)}
              />
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
