"use client";

import React, { useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import { getLogs, clearLogs, formatLogs, type LogEntry } from "@/lib/log";
import { Button } from "@/ui/Button";
import { BackLink } from "@/ui/BackLink";
import { Chip } from "@/ui/Chip";
import { EmptyState } from "@/ui/EmptyState";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { useToast } from "@/ui/Toast";
import { formatDateTime } from "@/lib/date";

export function LogScreen() {
  const { show } = useToast();
  const [entries, setEntries] = useState<LogEntry[]>(() => getLogs());
  const [confirmClear, setConfirmClear] = useState(false);

  const copy = async () => {
    const text = formatLogs(entries) || "(kosong)";
    try {
      await navigator.clipboard.writeText(text);
      show("Log disalin", { tone: "success" });
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      show("Log disalin", { tone: "success" });
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
      <BackLink />
        <h1 className="text-lg font-extrabold">Log</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={copy}>
            <Copy size={16} /> Salin
          </Button>
          <Button variant="danger" onClick={() => setConfirmClear(true)}>
            <Trash2 size={16} /> Hapus
          </Button>
        </div>
      </div>

      <p className="mb-3 text-xs text-ink-muted">
        Catatan error terakhir di perangkat ini. Salin dan kirimkan ke pengembang bila ada
        masalah.
      </p>

      {entries.length === 0 ? (
        <EmptyState title="Belum ada log" description="Tidak ada error tercatat." />
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
          {entries
            .slice()
            .reverse()
            .map((e, idx) => (
              <li key={`${e.ts}-${idx}`} className="flex flex-col gap-1 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Chip
                    tone={
                      e.level === "error"
                        ? "danger"
                        : e.level === "warn"
                          ? "warning"
                          : "default"
                    }
                  >
                    {e.level}
                  </Chip>
                  <span className="text-[11px] text-ink-muted">
                    {formatDateTime(e.ts)}
                  </span>
                </div>
                <div className="text-xs font-semibold">{e.context}</div>
                <div className="break-all text-xs text-ink-muted">{e.message}</div>
              </li>
            ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Hapus semua log?"
        message="Catatan error di perangkat ini akan dihapus."
        confirmLabel="Hapus"
        danger
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearLogs();
          setEntries([]);
          setConfirmClear(false);
        }}
      />
    </div>
  );
}
