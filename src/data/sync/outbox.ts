import { db } from "../db";
import { getNowISO } from "@/lib/date";

export async function recordOutbox(
  table: string,
  rowId: string,
  op: "insert" | "upsert",
  payload: Record<string, unknown>
): Promise<void> {
  await db.outbox.add({
    table,
    row_id: rowId,
    op,
    payload,
    attempts: 0,
    status: "pending",
    last_error: null,
    created_at: getNowISO(),
  });
}
