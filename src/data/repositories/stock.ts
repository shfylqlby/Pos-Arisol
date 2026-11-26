import { db } from "../db";
import type { StockMovement } from "../schemas";
import { recordOutbox } from "../sync/outbox";
import { createId } from "@/lib/id";
import { getNowISO, getBusinessDate } from "@/lib/date";
import {
  calculateStock,
  computeClosingMovements,
  type ClosingDayItem,
} from "@/domain/stock";

export async function recordStockMovement(
  movement: Omit<StockMovement, "id" | "created_at">
): Promise<StockMovement> {
  const item: StockMovement = {
    ...movement,
    id: createId(),
    created_at: getNowISO(),
  };

  await db.transaction("rw", [db.stock_movements, db.outbox], async () => {
    await db.stock_movements.add(item);
    await recordOutbox(
      "stock_movements",
      item.id,
      "insert",
      item as unknown as Record<string, unknown>
    );
  });

  return item;
}

export async function recordProduction(
  productId: string,
  qty: number,
  unitCost: number,
  businessDate: string = getBusinessDate(),
  note: string = ""
): Promise<StockMovement> {
  return recordStockMovement({
    product_id: productId,
    type: "production",
    qty: Math.abs(qty),
    unit_cost: unitCost,
    business_date: businessDate,
    ref_type: "production",
    ref_id: null,
    reason: null,
    note: note || null,
  });
}

export async function recordClosingDay(
  items: ClosingDayItem[],
  businessDate: string = getBusinessDate()
): Promise<void> {
  const movements = computeClosingMovements(items, businessDate);
  const closingRefId = createId();

  await db.transaction("rw", [db.stock_movements, db.outbox], async () => {
    for (const m of movements) {
      const item: StockMovement = {
        id: createId(),
        product_id: m.productId,
        type: m.type,
        qty: m.qty,
        unit_cost: m.unitCost,
        business_date: m.business_date,
        ref_type: "closing",
        ref_id: closingRefId,
        reason: m.reason,
        note: null,
        created_at: getNowISO(),
      };
      await db.stock_movements.add(item);
      await recordOutbox(
        "stock_movements",
        item.id,
        "insert",
        item as unknown as Record<string, unknown>
      );
    }
  });
}

export async function getProductStock(productId: string): Promise<number> {
  const movements = await db.stock_movements
    .where("product_id")
    .equals(productId)
    .toArray();
  return calculateStock(movements);
}

export async function getAllProductsStock(): Promise<Record<string, number>> {
  const movements = await db.stock_movements.toArray();
  const stockMap: Record<string, number> = {};

  for (const m of movements) {
    stockMap[m.product_id] = (stockMap[m.product_id] || 0) + m.qty;
  }

  return stockMap;
}

export async function listMovementsByDate(
  businessDate: string
): Promise<StockMovement[]> {
  return db.stock_movements.where("business_date").equals(businessDate).toArray();
}

export async function listMovements(
  productId?: string,
  limit: number = 100
): Promise<StockMovement[]> {
  if (productId) {
    const list = await db.stock_movements
      .where("product_id")
      .equals(productId)
      .reverse()
      .sortBy("created_at");
    return list.slice(0, limit);
  }
  const all = await db.stock_movements
    .orderBy("created_at")
    .reverse()
    .limit(limit)
    .toArray();
  return all;
}
