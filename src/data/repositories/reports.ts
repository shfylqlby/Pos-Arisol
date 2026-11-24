import { db } from "../db";
import type { Sale, SaleItem, StockMovement } from "../schemas";

export interface ReportData {
  sales: Sale[];
  saleItems: SaleItem[];
  voidSaleIds: Set<string>;
  waste: StockMovement[];
}

export async function getReportData(
  startDate: string,
  endDate: string
): Promise<ReportData> {
  const sales = (
    await db.sales.where("business_date").between(startDate, endDate, true, true).toArray()
  ).sort((a, b) => b.created_at.localeCompare(a.created_at));

  const saleIds = new Set(sales.map((s) => s.id));
  const saleItems = (await db.sale_items.toArray()).filter((i) =>
    saleIds.has(i.sale_id)
  );

  const voidSaleIds = new Set(
    (await db.sale_voids.toArray())
      .map((v) => v.sale_id)
      .filter((id) => saleIds.has(id))
  );

  const waste = (
    await db.stock_movements
      .where("business_date")
      .between(startDate, endDate, true, true)
      .toArray()
  ).filter((m) => m.type === "waste");

  return { sales, saleItems, voidSaleIds, waste };
}

export async function getDailyOmzet(
  startDate: string,
  endDate: string
): Promise<{ date: string; total: number }[]> {
  const { sales, voidSaleIds } = await getReportData(startDate, endDate);
  const map: Record<string, number> = {};
  for (const s of sales) {
    if (voidSaleIds.has(s.id)) continue;
    map[s.business_date] = (map[s.business_date] || 0) + s.total;
  }

  const days: { date: string; total: number }[] = [];
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, total: map[key] || 0 });
  }
  return days;
}
