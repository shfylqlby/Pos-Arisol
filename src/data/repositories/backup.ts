import { db } from "../db";
import { getNowISO } from "@/lib/date";

export const BACKUP_TABLES = [
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

export type BackupTable = (typeof BACKUP_TABLES)[number];

export interface BackupFile {
  app: "pos-risol";
  version: number;
  exported_at: string;
  tables: Partial<Record<BackupTable, unknown[]>>;
}

type GenericTable = {
  toArray: () => Promise<unknown[]>;
  clear: () => Promise<void>;
  bulkPut: (rows: unknown[]) => Promise<unknown>;
};

function table(name: BackupTable): GenericTable {
  return (db as unknown as Record<string, GenericTable>)[name];
}

export async function exportAllData(): Promise<BackupFile> {
  const tables: BackupFile["tables"] = {};
  for (const name of BACKUP_TABLES) {
    tables[name] = await table(name).toArray();
  }
  return {
    app: "pos-risol",
    version: 1,
    exported_at: getNowISO(),
    tables,
  };
}

export async function importAllData(payload: BackupFile): Promise<void> {
  if (payload.app !== "pos-risol" || !payload.tables) {
    throw new Error("File backup tidak valid");
  }

  await db.transaction("rw", db.tables, async () => {
    for (const name of BACKUP_TABLES) {
      const rows = payload.tables[name];
      if (!Array.isArray(rows)) continue;
      const t = table(name);
      await t.clear();
      if (rows.length > 0) await t.bulkPut(rows);
    }
    await db.outbox.clear();
  });
}
