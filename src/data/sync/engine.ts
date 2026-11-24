import { pushOutboxBatch } from "./push";
import { pullAll } from "./pull";
import { getSupabaseClient } from "./supabase";

export type SyncPhase = "idle" | "syncing" | "error" | "offline" | "local";

export interface SyncStatus {
  phase: SyncPhase;
  pending: number;
  lastError: string | null;
  lastSyncedAt: string | null;
}

let status: SyncStatus = {
  phase: "idle",
  pending: 0,
  lastError: null,
  lastSyncedAt: null,
};

type Listener = (s: SyncStatus) => void;
const listeners = new Set<Listener>();

export function subscribeSync(listener: Listener): () => void {
  listeners.add(listener);
  listener(status);
  return () => listeners.delete(listener);
}

function emit(next: Partial<SyncStatus>) {
  status = { ...status, ...next };
  listeners.forEach((l) => l(status));
}

export async function refreshSyncStatus(): Promise<void> {
  const { db } = await import("../db");
  const pending = await db.outbox.where("status").equals("pending").count();
  const dead = await db.outbox.where("status").equals("dead").count();

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    emit({ phase: "offline", pending });
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    emit({ phase: "local", pending });
    return;
  }

  if (dead > 0) {
    emit({ phase: "error", pending, lastError: `${dead} item gagal permanen` });
    return;
  }

  if (pending > 0) {
    emit({ phase: "syncing", pending });
  } else {
    emit({ phase: "idle", pending: 0, lastError: null });
  }
}

let running = false;
let timer: ReturnType<typeof setInterval> | null = null;

export async function runSync(): Promise<void> {
  if (running) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await refreshSyncStatus();
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    await refreshSyncStatus();
    return;
  }

  running = true;
  emit({ phase: "syncing" });

  try {
    await pushOutboxBatch();
    await pullAll();
    const { db } = await import("../db");
    const pending = await db.outbox.where("status").equals("pending").count();
    emit({
      phase: pending > 0 ? "syncing" : "idle",
      pending,
      lastError: null,
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    emit({ phase: "error", lastError: msg });
  } finally {
    running = false;
  }
}

export function startSyncEngine(): () => void {
  if (typeof window === "undefined") return () => {};

  const onOnline = () => runSync();
  const onOffline = () => refreshSyncStatus();

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  timer = setInterval(() => runSync(), 30000);
  void runSync();

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    if (timer) clearInterval(timer);
  };
}
