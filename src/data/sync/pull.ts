import { db } from "../db";
import { getSupabaseClient } from "./supabase";
import type { SyncState } from "../schemas";

export const SYNCABLE_TABLES = [
  "settings",
  "products",
  "sales",
  "sale_items",
  "sale_voids",
  "stock_movements",
  "preorders",
  "preorder_items",
  "partners",
  "partner_prices",
  "consignment_drops",
  "consignment_drop_items",
  "consignment_settlements",
  "consignment_settlement_items",
] as const;

async function getCursor(table: string): Promise<string> {
  const state = await db.sync_state.get(table);
  return state?.cursor || "1970-01-01T00:00:00Z";
}

async function setCursor(table: string, cursor: string): Promise<void> {
  const state: SyncState = {
    table,
    cursor,
    last_synced_at: new Date().toISOString(),
  };
  await db.sync_state.put(state);
}

export async function pullAll(): Promise<{ pulled: number }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { pulled: 0 };

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) return { pulled: 0 };

  let pulled = 0;
  const pendingRows = await db.outbox.where("status").equals("pending").toArray();
  const pendingKeys = new Set(pendingRows.map((o) => `${o.table}:${o.row_id}`));

  for (const table of SYNCABLE_TABLES) {
    let cursor = await getCursor(table);
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .gt("server_updated_at", cursor)
        .order("server_updated_at", { ascending: true })
        .limit(500);

      if (error) {
        console.error(`Pull error on ${table}`, error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      const dexieTable = db.table(table);
      for (const row of data) {
        const rowId = String((row as Record<string, unknown>).id ?? "");
        if (pendingKeys.has(`${table}:${rowId}`)) {
          cursor = (row as Record<string, unknown>).server_updated_at as string;
          continue;
        }
        // Strip server-only column before writing locally
        const { server_updated_at, ...localRow } = row as Record<string, unknown>;
        if (table === "settings") {
          const existing = await db.settings.get(rowId);
          if (existing) localRow.pin_hash = existing.pin_hash;
        }
        await dexieTable.put(localRow);
        cursor = server_updated_at as string;
        pulled++;
      }

      await setCursor(table, cursor);
      if (data.length < 500) hasMore = false;
    }
  }

  return { pulled };
}
