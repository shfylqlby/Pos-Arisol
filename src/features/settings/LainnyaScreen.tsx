"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Package, Settings, DatabaseBackup, Info, ChevronRight, Lock } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { getSettings } from "@/data/repositories/settings";
import { TextInput } from "@/ui/Field";
import { Button } from "@/ui/Button";
import { hashPin } from "./SettingsScreen";

const items = [
  { href: "/lainnya/produk", label: "Produk", icon: Package, desc: "Menu, harga, modal" },
  { href: "/lainnya/pengaturan", label: "Pengaturan", icon: Settings, desc: "Usaha, QRIS, tema, akun" },
  { href: "/lainnya/backup", label: "Backup", icon: DatabaseBackup, desc: "Ekspor & impor data" },
  { href: "/lainnya/tentang", label: "Tentang", icon: Info, desc: "Versi aplikasi" },
];

const UNLOCK_KEY = "pos-unlocked";

export function LainnyaScreen() {
  const settings = useLiveQuery(() => getSettings(), [], undefined);
  const [unlocked, setUnlocked] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(UNLOCK_KEY) === "1"
  );
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  if (!settings) {
    return <div className="mx-auto max-w-2xl px-4 py-6 text-sm text-ink-muted">Memuat…</div>;
  }

  if (settings.pin_hash && !unlocked) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 px-4 py-12">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Lock size={26} />
        </span>
        <h1 className="text-lg font-extrabold">Masukkan PIN</h1>
        <TextInput
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ""));
            setError("");
          }}
          className="text-center text-2xl tracking-[0.5em]"
          placeholder="••••"
          autoFocus
        />
        {error && <p className="text-xs font-medium text-danger">{error}</p>}
        <Button
          fullWidth
          onClick={async () => {
            if ((await hashPin(pin)) === settings.pin_hash) {
              sessionStorage.setItem(UNLOCK_KEY, "1");
              setUnlocked(true);
            } else {
              setError("PIN salah");
            }
          }}
        >
          Buka
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4">
      <h1 className="mb-3 text-lg font-extrabold">Lainnya</h1>
      <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link href={it.href} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Icon size={20} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{it.label}</span>
                  <span className="block text-xs text-ink-muted">{it.desc}</span>
                </span>
                <ChevronRight size={18} className="text-ink-muted" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
