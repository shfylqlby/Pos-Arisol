"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MessageCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import { formatRupiah } from "@/domain/money";
import { Button } from "@/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/ui/Field";
import { usePublicMenu } from "@/features/landing/usePublicMenu";
import { notifyPublicPreorder } from "@/data/public-preorders";

const WHATSAPP_NUMBER = "6285869836066";

function localDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function PreorderForm() {
  const items = usePublicMenu();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [method, setMethod] = useState("ambil");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [minDate, setMinDate] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setMinDate(localDateInputValue(new Date()));
  }, []);

  const selectedItems = useMemo(
    () =>
      items
        .filter((item) => (quantities[item.id] ?? 0) > 0)
        .map((item) => ({
          ...item,
          qty: quantities[item.id],
        })),
    [items, quantities]
  );

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))),
    [items]
  );

  const total = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [selectedItems]
  );

  const totalQty = selectedItems.reduce((sum, item) => sum + item.qty, 0);

  const changeQty = (id: string, delta: number) => {
    const stock = items.find((item) => item.id === id)?.stock_qty;
    const max = stock === null || stock === undefined ? 99 : Math.min(99, Math.max(0, stock));
    setQuantities((current) => {
      const next = Math.max(0, Math.min(max, (current[id] ?? 0) + delta));
      return { ...current, [id]: next };
    });
    setSent(false);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSent(false);

    if (!name.trim()) return setError("Isi nama pemesan dulu ya.");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15) {
      return setError("Nomor WhatsApp belum valid. Contoh: 0812 3456 7890.");
    }
    if (!date) return setError("Pilih tanggal pengambilan atau pengiriman.");
    if (minDate && date < minDate) return setError("Tanggal tidak boleh di masa lalu.");
    if (totalQty === 0) return setError("Pilih minimal satu menu.");
    const short = selectedItems.find(
      (item) => item.stock_qty !== null && item.qty > item.stock_qty
    );
    if (short) {
      return setError(
        `Stok ${short.name} tersisa ${Math.max(0, short.stock_qty ?? 0)}. Kurangi jumlahnya.`
      );
    }
    if (method === "kirim" && !address.trim()) {
      return setError("Isi alamat pengiriman untuk pesanan kirim.");
    }

    const lines = [
      "Halo Arisol, saya mau pre-order:",
      "",
      ...selectedItems.map(
        (item) => `- ${item.name} x${item.qty} = ${formatRupiah(item.price * item.qty)}`
      ),
      "",
      `Total estimasi: ${formatRupiah(total)}`,
      `Nama: ${name.trim()}`,
      `No. WhatsApp: ${phone.trim()}`,
      method === "ambil"
        ? `Ambil: ${date}${time ? ` jam ${time}` : ""}`
        : `Kirim: ${date}${time ? ` jam ${time}` : ""}`,
      ...(method === "kirim" ? [`Alamat: ${address.trim()}`] : []),
      ...(note.trim() ? [`Catatan: ${note.trim()}`] : []),
      "",
      "Mohon konfirmasi ketersediaan dan total akhirnya. Terima kasih.",
    ];

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
    void notifyPublicPreorder({
      name: name.trim(),
      phone: phone.trim(),
      date,
      time: time || undefined,
      method: method === "kirim" ? "kirim" : "ambil",
      address: method === "kirim" ? address.trim() : undefined,
      note: note.trim() || undefined,
      items: selectedItems.map((item) => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
      })),
      total,
    }).catch(() => false);
  };

  return (
    <form onSubmit={submit} className="rounded-card border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-btn bg-primary-soft text-primary">
          <ShoppingBag size={22} />
        </span>
        <div>
          <h3 className="text-base font-extrabold">Form pre-order</h3>
          <p className="text-xs text-ink-muted">Isi lalu kirim lewat WhatsApp</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Nama" htmlFor="preorder-name">
          <TextInput
            id="preorder-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nama pemesan"
            autoComplete="name"
          />
        </Field>
        <Field label="Nomor WhatsApp" htmlFor="preorder-phone">
          <TextInput
            id="preorder-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="0812 3456 7890"
            inputMode="tel"
            autoComplete="tel"
          />
        </Field>
        <Field label="Tanggal" htmlFor="preorder-date">
          <TextInput
            id="preorder-date"
            type="date"
            min={minDate || undefined}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>
        <Field label="Jam (opsional)" htmlFor="preorder-time">
          <TextInput
            id="preorder-time"
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </Field>
        <Field label="Cara terima" htmlFor="preorder-method">
          <Select
            id="preorder-method"
            value={method}
            onChange={(event) => setMethod(event.target.value)}
          >
            <option value="ambil">Ambil di tempat</option>
            <option value="kirim">Kirim (area Banyumanik)</option>
          </Select>
        </Field>
        {method === "kirim" && (
          <Field label="Alamat kirim" htmlFor="preorder-address">
            <TextInput
              id="preorder-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Alamat lengkap di Banyumanik"
              autoComplete="street-address"
            />
          </Field>
        )}
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold">Pilih menu</p>
        <p className="mt-0.5 text-xs text-ink-muted">
          Jumlah dibatasi stok yang tersedia saat ini.
        </p>
        <div className="mt-2 space-y-3">
          {categories.map((category) => (
            <div key={category} className="rounded-btn border border-border">
              <p className="border-b border-border bg-surface px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-ink-muted">
                {category}
              </p>
              <div className="divide-y divide-border">
                {items.filter((item) => item.category === category).map((item) => {
                  const qty = quantities[item.id] ?? 0;
                  const limited = item.stock_qty !== null;
                  const stock = Math.max(0, item.stock_qty ?? 0);
                  const soldOut = limited && stock === 0;
                  const atMax = limited ? qty >= stock : qty >= 99;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-ink-muted">
                          {formatRupiah(item.price)}
                          {limited && (
                            <span
                              className={soldOut ? "font-bold text-danger" : "text-success"}
                            >
                              {soldOut ? " · Habis" : ` · Sisa ${stock}`}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => changeQty(item.id, -1)}
                          disabled={qty === 0}
                          aria-label={`Kurangi ${item.name}`}
                          className="flex h-11 w-11 items-center justify-center rounded-btn border border-border disabled:opacity-30"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-6 text-center text-sm font-bold tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQty(item.id, 1)}
                          disabled={soldOut || atMax}
                          aria-label={`Tambah ${item.name}`}
                          className="flex h-11 w-11 items-center justify-center rounded-btn border border-border disabled:opacity-30"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <Field label="Catatan (opsional)" htmlFor="preorder-note">
          <TextArea
            id="preorder-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Contoh: tidak pedas, untuk acara kantor, minta dipisah per box."
          />
        </Field>
      </div>

      <div className="mt-4 rounded-btn border border-border bg-bg p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-muted">Jumlah</span>
          <span className="font-semibold tabular-nums">{totalQty} pcs</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm text-ink-muted">Estimasi total</span>
          <span className="text-lg font-black text-primary tabular-nums">
            {formatRupiah(total)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-ink-muted">
          Estimasi belum termasuk ongkir. Total akhir dikonfirmasi lewat WhatsApp.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      {sent && (
        <p role="status" className="mt-3 text-sm font-medium text-success">
          WhatsApp dibuka di tab baru. Kirim pesannya untuk menyelesaikan pre-order.
        </p>
      )}

      <Button type="submit" fullWidth size="lg" className="mt-4">
        <MessageCircle size={18} /> Kirim pre-order via WhatsApp
      </Button>
    </form>
  );
}
