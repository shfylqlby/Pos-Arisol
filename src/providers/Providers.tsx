"use client";

import React, { useEffect, useState } from "react";
import { ToastProvider } from "@/ui/Toast";
import { OfflineBanner } from "@/ui/OfflineBanner";
import { startSyncEngine } from "@/data/sync/engine";
import { db } from "@/data/db";
import { ensureSettings } from "@/data/repositories/settings";
import { installGlobalErrorLogging, logError } from "@/lib/log";

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    installGlobalErrorLogging();
    let cancelled = false;
    async function init() {
      try {
        await db.open();
        await ensureSettings();
      } catch (err) {
        console.error("DB open failed", err);
        logError("db.open", err);
      }
      if (cancelled) return;
      setReady(true);

      // Theme
      const saved = localStorage.getItem("pos-theme");
      if (saved === "dark") {
        document.documentElement.classList.add("dark");
      } else if (saved === "system") {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          document.documentElement.classList.add("dark");
        }
      }

      // Request persistent storage once
      if (navigator.storage?.persist) {
        try {
          await navigator.storage.persist();
        } catch {
          /* ignore */
        }
      }
    }
    void init();

    const stop = startSyncEngine();
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="border-primary/30 h-10 w-10 animate-spin rounded-full border-4 border-t-primary" />
          <p className="text-sm text-ink-muted">Menyiapkan data…</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <OfflineBanner />
      {children}
    </ToastProvider>
  );
}
