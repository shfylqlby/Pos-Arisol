import { db } from "../db";
import type { Outbox } from "../schemas";

export interface OutboxSummary {
  pending: number;
  dead: number;
  total: number;
  lastError: string | null;
}

export async function getOutboxSummary(): Promise<OutboxSummary> {
  const pending = await db.outbox.where("status").equals("pending").count();
  const dead = await db.outbox.where("status").equals("dead").count();
  const total = await db.outbox.count();
  const last = await db.outbox.orderBy("seq").reverse().first();
  return {
    pending,
    dead,
    total,
    lastError: last?.last_error ?? null,
  };
}

export async function listOutbox(limit = 50): Promise<Outbox[]> {
  const items = await db.outbox.orderBy("seq").reverse().limit(limit).toArray();
  return items;
}

export async function retryDeadOutbox(): Promise<number> {
  const dead = await db.outbox.where("status").equals("dead").toArray();
  await db.transaction("rw", db.outbox, async () => {
    for (const item of dead) {
      if (item.seq === undefined) continue;
      await db.outbox.update(item.seq, {
        status: "pending",
        attempts: 0,
        last_error: null,
      });
    }
  });
  return dead.length;
}

export async function clearOutbox(): Promise<void> {
  await db.outbox.clear();
}
