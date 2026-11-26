"use client";

import React, { useRef, useState } from "react";
import { Download, Upload, AlertTriangle } from "lucide-react";
import {
  exportAllData,
  importAllData,
  type BackupFile,
} from "@/data/repositories/backup";
import { Button } from "@/ui/Button";
import { BackLink } from "@/ui/BackLink";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { useToast } from "@/ui/Toast";

export function BackupPanel() {
  const { show } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [busy, setBusy] = useState(false);

  const exportJson = async () => {
    setBusy(true);
    try {
      const payload = await exportAllData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-pos-risol-${payload.exported_at.slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      show("Backup diunduh", { tone: "success" });
    } catch (err) {
      console.error(err);
      show("Gagal membuat backup", { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupFile;
      if (parsed.app !== "pos-risol" || !parsed.tables) {
        show("File backup tidak valid", { tone: "warning" });
        return;
      }
      setPending(parsed);
    } catch {
      show("File tidak bisa dibaca", { tone: "warning" });
    }
  };

  const restore = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await importAllData(pending);
      show("Data dipulihkan. Memuat ulang…", { tone: "success" });
      setPending(null);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      console.error(err);
      show(err instanceof Error ? err.message : "Gagal memulihkan data", {
        tone: "warning",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4">
      <BackLink />
      <h1 className="mb-4 text-lg font-extrabold">Backup</h1>

      <div className="flex flex-col gap-4">
        <section className="rounded-card border border-border bg-surface p-4">
          <h2 className="text-sm font-bold">Ekspor data</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Simpan seluruh data (produk, transaksi, stok, pesanan, titip jual) ke satu
            file JSON. Simpan file di tempat aman.
          </p>
          <Button
            className="mt-3"
            variant="secondary"
            disabled={busy}
            onClick={exportJson}
          >
            <Download size={18} /> Unduh backup
          </Button>
        </section>

        <section className="rounded-card border border-border bg-surface p-4">
          <h2 className="text-sm font-bold">Impor / pulihkan</h2>
          <p className="mt-1 flex items-start gap-1 text-xs text-warning">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Data saat ini akan diganti seluruhnya oleh isi file backup.
          </p>
          <Button
            className="mt-3"
            variant="secondary"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={18} /> Pilih file backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />
        </section>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title="Pulihkan data?"
        message={`File backup tanggal ${pending?.exported_at?.slice(0, 10) ?? ""}. Semua data saat ini akan diganti.`}
        confirmLabel="Ya, pulihkan"
        danger
        onCancel={() => setPending(null)}
        onConfirm={restore}
      />
    </div>
  );
}
