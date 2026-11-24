/**
 * Domain: Stock calculation from ledger
 * Pure functions without DB/React imports
 */

export interface StockMovementItem {
  product_id: string;
  qty: number;
  type: string;
  unit_cost: number;
  business_date: string;
}

export interface StockSummary {
  currentStock: number;
  producedToday: number;
  soldToday: number;
  wasteToday: number;
}

export function calculateStock(movements: { qty: number }[]): number {
  return movements.reduce((acc, m) => acc + m.qty, 0);
}

export function calculateStockSummary(
  movements: StockMovementItem[],
  businessDate: string
): StockSummary {
  let currentStock = 0;
  let producedToday = 0;
  let soldToday = 0;
  let wasteToday = 0;

  for (const m of movements) {
    currentStock += m.qty;

    if (m.business_date === businessDate) {
      if (m.type === "production") {
        producedToday += m.qty;
      } else if (m.type === "sale") {
        soldToday += Math.abs(m.qty);
      } else if (m.type === "sale_void") {
        soldToday -= m.qty; // reversal
      } else if (m.type === "waste") {
        wasteToday += Math.abs(m.qty);
      }
    }
  }

  return {
    currentStock,
    producedToday,
    soldToday: Math.max(0, soldToday),
    wasteToday,
  };
}

export interface StockStatus {
  status: "out_of_stock" | "low_stock" | "normal";
  label: "Habis" | "Hampir habis" | "Aman";
}

export function getStockStatus(
  currentStock: number,
  threshold: number = 10
): StockStatus {
  if (currentStock <= 0) {
    return { status: "out_of_stock", label: "Habis" };
  }
  if (currentStock <= threshold) {
    return { status: "low_stock", label: "Hampir habis" };
  }
  return { status: "normal", label: "Aman" };
}

export interface ClosingDayItem {
  productId: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  unitCost: number;
  reason?: string;
}

export function computeClosingMovements(
  items: ClosingDayItem[],
  businessDate: string
): {
  productId: string;
  type: "waste" | "adjustment";
  qty: number;
  unitCost: number;
  business_date: string;
  reason: string;
}[] {
  const result: {
    productId: string;
    type: "waste" | "adjustment";
    qty: number;
    unitCost: number;
    business_date: string;
    reason: string;
  }[] = [];

  for (const item of items) {
    const diff = item.physicalStock - item.systemStock;
    if (diff < 0) {
      // Physical < System -> Waste (selisih negatif)
      result.push({
        productId: item.productId,
        type: "waste",
        qty: diff, // signed: negative
        unitCost: item.unitCost,
        business_date: businessDate,
        reason: item.reason || "Basi/Rusak",
      });
    } else if (diff > 0) {
      // Physical > System -> Adjustment (selisih positif)
      result.push({
        productId: item.productId,
        type: "adjustment",
        qty: diff, // signed: positive
        unitCost: item.unitCost,
        business_date: businessDate,
        reason: item.reason || "Koreksi fisik lebih",
      });
    }
  }

  return result;
}
