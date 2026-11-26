import { db } from "../db";
import type { SyncState } from "../schemas";

export async function getSyncStates(): Promise<SyncState[]> {
  const states = await db.sync_state.toArray();
  return states.sort((a, b) => a.table.localeCompare(b.table));
}

export async function getLastSyncedAt(): Promise<string | null> {
  const states = await db.sync_state.toArray();
  const times = states
    .map((s) => s.last_synced_at)
    .filter((v): v is string => Boolean(v));
  if (times.length === 0) return null;
  return times.sort().at(-1) ?? null;
}
