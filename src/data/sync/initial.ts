import { db } from "../db";
import { recordOutbox } from "./outbox";
import { SYNCABLE_TABLES } from "./pull";

const flagFor = (userId: string) => `pos-initial-upload:${userId}`;

export function hasInitialUpload(userId: string): boolean {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(flagFor(userId)) === "1";
}

export async function enqueueInitialUpload(userId: string): Promise<number> {
  if (typeof localStorage === "undefined") return 0;
  if (hasInitialUpload(userId)) return 0;

  const existing = await db.outbox.toArray();
  const queuedKeys = new Set(existing.map((o) => `${o.table}:${o.row_id}`));

  let queued = 0;
  for (const table of SYNCABLE_TABLES) {
    const rows = (await db.table(table).toArray()) as Record<string, unknown>[];
    for (const row of rows) {
      const id = String(row.id ?? "");
      if (!id) continue;
      const key = `${table}:${id}`;
      if (queuedKeys.has(key)) continue;

      const payload: Record<string, unknown> = { ...row };
      if (table === "settings") delete payload.pin_hash;

      await recordOutbox(table, id, "upsert", payload);
      queuedKeys.add(key);
      queued++;
    }
  }

  localStorage.setItem(flagFor(userId), "1");
  return queued;
}
