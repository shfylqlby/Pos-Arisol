"use client";

import React, { useState } from "react";
import { Store, Download } from "lucide-react";
import { Button } from "@/ui/Button";
import { Field, TextInput } from "@/ui/Field";
import { updateSettings } from "@/data/repositories/settings";
import { initDefaultProducts } from "@/data/repositories/products";
import { useToast } from "@/ui/Toast";

interface OnboardingProps {
  onDone: () => void;
}

export function Onboarding({ onDone }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  const finish = async () => {
    setSaving(true);
    try {
      if (name.trim()) {
        await updateSettings({ business_name: name.trim() });
      }
      await initDefaultProducts();
      show("Selamat berjualan!", { tone: "success" });
      onDone();
    } catch (err) {
      console.error(err);
      show("Gagal menyiapkan data. Coba lagi.", { tone: "warning" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-6 py-8">
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Store size={28} />
          </div>
          <h1 className="text-2xl font-extrabold">Selamat datang!</h1>
          <p className="text-sm text-ink-muted">
            Yuk siapkan lapakmu dalam 1 menit. Semua data tersimpan di HP ini dan tetap
            jalan tanpa internet.
          </p>
          <Field label="Nama usaha">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Risol Bu Sari"
              autoFocus
            />
          </Field>
          <Button size="lg" fullWidth onClick={() => setStep(2)}>
            Lanjut
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-extrabold">3 menu awal disiapkan</h1>
          <p className="text-sm text-ink-muted">
            Kami tambahkan Risol Mayo, Risol Ragout, dan Risol Sayur. Harga dan modal bisa
            kamu ubah nanti di menu Produk.
          </p>
          <div className="rounded-card border border-border bg-surface p-4 text-sm">
            <ul className="flex flex-col gap-1">
              <li>• Risol Mayo — Rp 3.000</li>
              <li>• Risol Ragout — Rp 3.000</li>
              <li>• Risol Sayur — Rp 2.500</li>
            </ul>
          </div>
          <Button size="lg" fullWidth onClick={() => setStep(3)}>
            Lanjut
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Download size={28} />
          </div>
          <h1 className="text-xl font-extrabold">Pasang di layar utama</h1>
          <p className="text-sm text-ink-muted">
            Supaya cepat dibuka dan tidak kehilangan data: buka menu browser lalu pilih
            &quot;Tambah ke Layar Utama&quot; (Android: Install app; iPhone: Share → Add
            to Home Screen).
          </p>
          <Button size="lg" fullWidth disabled={saving} onClick={finish}>
            {saving ? "Menyiapkan…" : "Mulai jualan"}
          </Button>
          <button onClick={finish} className="text-xs font-semibold text-ink-muted">
            Lewati
          </button>
        </div>
      )}
    </div>
  );
}
