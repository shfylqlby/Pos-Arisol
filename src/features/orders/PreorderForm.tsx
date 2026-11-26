"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { listProducts } from "@/data/repositories/products";
import { createPreorder } from "@/data/repositories/preorders";
import { formatRupiah, parseRupiah } from "@/domain/money";
import { Button } from "@/ui/Button";
import { Field, TextInput, TextArea } from "@/ui/Field";
import { Stepper } from "@/ui/Stepper";
import { useToast } from "@/ui/Toast";

interface PreorderFormProps {
  onDone: () => void;
}

export function PreorderForm({ onDone }: PreorderFormProps) {
  const products = useLiveQuery(() => listProducts(false), [], []);
  const { show } = useToast();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupAt, setPickupAt] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [depositText, setDepositText] = useState("");
  const [note, setNote] = useState("");
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const items = Object.entries(qtys)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => ({ product_id: id, qty }));

  const total = items.reduce((acc, it) => {
    const p = products.find((x) => x.id === it.product_id);
    return acc + (p ? p.price * it.qty : 0);
  }, 0);

  const deposit = parseRupiah(depositText);

  const submit = async () => {
    if (!customerName.trim()) {
      show("Nama pelanggan wajib diisi", { tone: "warning" });
      return;
    }
    if (items.length === 0) {
      show("Pilih minimal satu menu", { tone: "warning" });
      return;
    }
    setSaving(true);
    try {
      await createPreorder({
        customer_name: customerName.trim(),
        phone,
        pickup_at: new Date(pickupAt).toISOString(),
        deposit,
        note: note || null,
        items,
      });
      show("Pesanan tersimpan", { tone: "success" });
      onDone();
    } catch (err) {
      console.error(err);
      show("Gagal menyimpan pesanan", { tone: "warning" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Field label="Nama pelanggan">
        <TextInput
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Contoh: Bu Ani"
        />
      </Field>
      <Field label="No. WhatsApp">
        <TextInput
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="08…"
        />
      </Field>
      <Field label="Tanggal & jam ambil">
        <TextInput
          type="datetime-local"
          value={pickupAt}
          onChange={(e) => setPickupAt(e.target.value)}
        />
      </Field>

      <div>
        <div className="mb-1 text-sm font-semibold">Menu</div>
        <div className="flex flex-col gap-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-btn border border-border px-3 py-2"
            >
              <div>
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="text-xs text-ink-muted">{formatRupiah(p.price)}</div>
              </div>
              <Stepper
                value={qtys[p.id] ?? 0}
                min={0}
                onChange={(v) => setQtys((prev) => ({ ...prev, [p.id]: v }))}
              />
            </div>
          ))}
        </div>
      </div>

      <Field label="DP (opsional)">
        <TextInput
          inputMode="numeric"
          value={depositText}
          onChange={(e) => setDepositText(e.target.value)}
          placeholder="0"
        />
      </Field>

      <Field label="Catatan (opsional)">
        <TextArea value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>

      <div className="bg-primary-soft/50 rounded-card p-3">
        <div className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatRupiah(total)}</span>
        </div>
        {deposit > 0 && (
          <div className="mt-1 flex justify-between text-sm text-ink-muted">
            <span>Sisa bayar</span>
            <span className="tabular-nums">
              {formatRupiah(Math.max(0, total - deposit))}
            </span>
          </div>
        )}
      </div>

      <Button fullWidth disabled={saving} onClick={submit}>
        {saving ? "Menyimpan…" : "Simpan pesanan"}
      </Button>
    </div>
  );
}
