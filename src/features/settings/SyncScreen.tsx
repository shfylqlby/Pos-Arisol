"use client";

import React, { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Cloud, CloudOff, RefreshCw, LogOut, Mail, AlertCircle } from "lucide-react";
import { getSettings } from "@/data/repositories/settings";
import {
  getOutboxSummary,
  listOutbox,
  retryDeadOutbox,
} from "@/data/repositories/outbox";
import { getLastSyncedAt, getSyncStates } from "@/data/repositories/sync";
import {
  runSync,
  subscribeSync,
  refreshSyncStatus,
  type SyncStatus,
} from "@/data/sync/engine";
import {
  isCloudConfigured,
  getCurrentUser,
  signInWithMagicLink,
  signInWithGoogle,
  signOut,
  onAuthChange,
} from "@/data/auth";
import type { User } from "@supabase/supabase-js";
import { formatDateTime } from "@/lib/date";
import { Button } from "@/ui/Button";
import { BackLink } from "@/ui/BackLink";
import { Field, TextInput } from "@/ui/Field";
import { Chip } from "@/ui/Chip";
import { useToast } from "@/ui/Toast";

export function SyncScreen() {
  const { show } = useToast();
  const settings = useLiveQuery(() => getSettings(), [], undefined);
  const summary = useLiveQuery(() => getOutboxSummary(), [], undefined);
  const items = useLiveQuery(() => listOutbox(20), [], []);
  const states = useLiveQuery(() => getSyncStates(), [], []);
  const lastSyncedAt = useLiveQuery(() => getLastSyncedAt(), [], null);
  const [status, setStatus] = useState<SyncStatus>({
    phase: "idle",
    pending: 0,
    lastError: null,
    lastSyncedAt: null,
  });
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const configured = isCloudConfigured();

  useEffect(() => {
    const unsub = subscribeSync(setStatus);
    void refreshSyncStatus();
    if (configured) {
      void getCurrentUser().then(setUser);
      const unsubAuth = onAuthChange((u) => {
        setUser(u);
        if (u) void runSync();
      });
      return () => {
        unsub();
        unsubAuth();
      };
    }
    return unsub;
  }, [configured]);

  const tz = settings?.timezone || "Asia/Jakarta";

  const doSync = async () => {
    setBusy(true);
    try {
      await runSync();
      await refreshSyncStatus();
      show("Sinkronisasi dijalankan", { tone: "success" });
    } finally {
      setBusy(false);
    }
  };

  const retry = async () => {
    setBusy(true);
    try {
      const n = await retryDeadOutbox();
      await runSync();
      show(`${n} item dicoba ulang`, { tone: n > 0 ? "success" : "info" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4">
      <BackLink />
      <h1 className="mb-4 text-lg font-extrabold">Sinkronisasi</h1>

      <section className="mb-4 rounded-card border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          {configured ? (
            <Cloud size={18} className="text-primary" />
          ) : (
            <CloudOff size={18} className="text-warning" />
          )}
          <h2 className="text-sm font-bold">
            {configured ? "Cloud aktif" : "Mode lokal"}
          </h2>
          {configured && (
            <Chip tone={user ? "success" : "warning"}>
              {user ? "Masuk" : "Belum masuk"}
            </Chip>
          )}
        </div>

        {!configured ? (
          <p className="mt-2 text-xs text-ink-muted">
            Aplikasi berjalan sepenuhnya di perangkat ini. Untuk sinkron antar perangkat,
            isi <code>NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> lalu buka ulang aplikasi.
          </p>
        ) : user ? (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-xs text-ink-muted">
              Masuk sebagai <span className="font-semibold text-ink">{user.email}</span>
            </p>
            <Button
              variant="secondary"
              onClick={async () => {
                await signOut();
                setUser(null);
                show("Keluar dari akun", { tone: "info" });
              }}
            >
              <LogOut size={18} /> Keluar
            </Button>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <Field label="Email" htmlFor="sync-email">
              <TextInput
                id="sync-email"
                type="email"
                inputMode="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSent(false);
                }}
              />
            </Field>
            <Button
              disabled={!email.trim()}
              onClick={async () => {
                try {
                  await signInWithMagicLink(email.trim());
                  setSent(true);
                  show("Tautan masuk dikirim. Cek email.", { tone: "success" });
                } catch (err) {
                  show(err instanceof Error ? err.message : "Gagal mengirim tautan", {
                    tone: "warning",
                  });
                }
              }}
            >
              <Mail size={18} /> Kirim tautan masuk
            </Button>
            {sent && (
              <p className="text-xs text-success">
                Tautan sudah dikirim. Buka email di perangkat ini, lalu kembali ke halaman
                ini.
              </p>
            )}
            <div className="flex items-center gap-2 text-[11px] text-ink-muted">
              <span className="h-px flex-1 bg-border" />
              atau
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (err) {
                  show(err instanceof Error ? err.message : "Gagal masuk Google", {
                    tone: "warning",
                  });
                }
              }}
            >
              Masuk dengan Google
            </Button>
          </div>
        )}
      </section>

      <section className="mb-4 rounded-card border border-border bg-surface p-4">
        <h2 className="text-sm font-bold">Antrean data</h2>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div className="bg-primary-soft/40 rounded-btn p-2">
            <div className="text-lg font-bold tabular-nums">{summary?.pending ?? 0}</div>
            <div className="text-[11px] text-ink-muted">Menunggu</div>
          </div>
          <div className="bg-primary-soft/40 rounded-btn p-2">
            <div className="text-lg font-bold tabular-nums">{summary?.dead ?? 0}</div>
            <div className="text-[11px] text-ink-muted">Gagal</div>
          </div>
          <div className="bg-primary-soft/40 rounded-btn p-2">
            <div className="text-lg font-bold tabular-nums">{summary?.total ?? 0}</div>
            <div className="text-[11px] text-ink-muted">Total</div>
          </div>
        </div>

        <div className="mt-3 text-xs text-ink-muted">
          Terakhir sinkron:{" "}
          {lastSyncedAt ? formatDateTime(lastSyncedAt, tz) : "belum pernah"}
        </div>
        {status.lastError && (
          <div className="bg-danger/10 mt-2 flex items-start gap-1 rounded-btn p-2 text-xs text-danger">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span className="break-all">{status.lastError}</span>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button disabled={busy || !configured} onClick={doSync}>
            <RefreshCw size={18} className={busy ? "animate-spin" : ""} /> Sinkronkan
          </Button>
          {(summary?.dead ?? 0) > 0 && (
            <Button variant="secondary" disabled={busy} onClick={retry}>
              Coba lagi yang gagal
            </Button>
          )}
        </div>
      </section>

      {items.length > 0 && (
        <section className="mb-4 rounded-card border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-bold">Item terbaru</h2>
          <ul className="flex flex-col divide-y divide-border">
            {items.map((item) => (
              <li key={item.seq} className="flex items-start justify-between gap-2 py-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold">
                    {item.table} · {item.op}
                  </div>
                  <div className="truncate text-[11px] text-ink-muted">{item.row_id}</div>
                  {item.last_error && (
                    <div className="mt-0.5 break-all text-[11px] text-danger">
                      {item.last_error}
                    </div>
                  )}
                </div>
                <Chip tone={item.status === "dead" ? "danger" : "warning"}>
                  {item.status === "dead" ? "gagal" : `coba ${item.attempts}`}
                </Chip>
              </li>
            ))}
          </ul>
        </section>
      )}

      {states.length > 0 && (
        <section className="rounded-card border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-bold">Cursor per tabel</h2>
          <ul className="flex flex-col gap-1 text-xs">
            {states.map((s) => (
              <li key={s.table} className="flex items-center justify-between gap-2">
                <span className="font-semibold">{s.table}</span>
                <span className="truncate text-ink-muted">
                  {s.last_synced_at ? formatDateTime(s.last_synced_at, tz) : "-"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
