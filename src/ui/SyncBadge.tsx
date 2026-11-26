"use client";

import React, { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { subscribeSync, type SyncStatus, refreshSyncStatus } from "@/data/sync/engine";

export function SyncBadge() {
  const [status, setStatus] = useState<SyncStatus>({
    phase: "idle",
    pending: 0,
    lastError: null,
    lastSyncedAt: null,
  });

  useEffect(() => {
    const unsub = subscribeSync(setStatus);
    void refreshSyncStatus();
    const iv = setInterval(() => void refreshSyncStatus(), 15000);
    return () => {
      unsub();
      clearInterval(iv);
    };
  }, []);

  const config = (() => {
    switch (status.phase) {
      case "syncing":
        return {
          icon: <RefreshCw size={12} className="animate-spin" />,
          text: `Menyinkron… (${status.pending})`,
          cls: "text-ink-muted",
        };
      case "offline":
        return {
          icon: <CloudOff size={12} />,
          text:
            status.pending > 0 ? `Offline · ${status.pending} belum terkirim` : "Offline",
          cls: "text-warning",
        };
      case "error":
        return {
          icon: <AlertCircle size={12} />,
          text: "Gagal sync",
          cls: "text-danger",
        };
      case "local":
        return {
          icon: <CheckCircle2 size={12} />,
          text: "Tersimpan di HP ini",
          cls: "text-success",
        };
      default:
        return {
          icon: <Cloud size={12} />,
          text: "Tersimpan",
          cls: "text-success",
        };
    }
  })();

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${config.cls}`}
      title={status.lastError || config.text}
    >
      {config.icon}
      {config.text}
    </span>
  );
}
