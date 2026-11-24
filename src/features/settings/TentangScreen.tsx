"use client";

import React from "react";

const version = "0.1.0";

export function TentangScreen() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4">
      <h1 className="mb-4 text-lg font-extrabold">Tentang</h1>
      <div className="rounded-card border border-border bg-surface p-4">
        <p className="text-sm font-bold">POS Risol</p>
        <p className="mt-1 text-xs text-ink-muted">Versi {version}</p>
        <p className="mt-3 text-sm text-ink-muted">
          Aplikasi kasir offline-first untuk penjual risol. Data tersimpan di
          perangkat dan disinkronkan saat online.
        </p>
      </div>
    </div>
  );
}
