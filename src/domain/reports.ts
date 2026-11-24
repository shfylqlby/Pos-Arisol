import type { Sale, SaleItem, StockMovement } from "@/data/schemas";

export interface ReportSummary {
  omzet: number;
  modal: number;
  untung: number;
  transactionCount: number;
  averagePerTransaction: number;
  wasteCost: number;
}

export interface BestSellerItem {
  productId: string;
  productName: string;
  qty: number;
  totalOmzet: number;
}

export interface PaymentBreakdown {
  cash: number;
  qris: number;
  transfer: number;
}

export function computeReport(
  sales: Sale[],
  saleItems: SaleItem[],
  voidSaleIds: Set<string>,
  wasteMovements: StockMovement[] = []
): {
  summary: ReportSummary;
  bestSellers: BestSellerItem[];
  paymentBreakdown: PaymentBreakdown;
} {
  // Only valid (non-void) sales
  const validSales = sales.filter((s) => !voidSaleIds.has(s.id));
  const validSaleIds = new Set(validSales.map((s) => s.id));
  const validItems = saleItems.filter((item) => validSaleIds.has(item.sale_id));

  let omzet = 0;
  const paymentBreakdown: PaymentBreakdown = {
    cash: 0,
    qris: 0,
    transfer: 0,
  };

  for (const s of validSales) {
    omzet += s.total;
    if (s.payment_method === "cash") {
      paymentBreakdown.cash += s.total;
    } else if (s.payment_method === "qris") {
      paymentBreakdown.qris += s.total;
    } else if (s.payment_method === "transfer") {
      paymentBreakdown.transfer += s.total;
    }
  }

  // Modal: snapshot unit_cost * qty
  let modal = 0;
  const productSalesMap: Record<
    string,
    { name: string; qty: number; totalOmzet: number }
  > = {};

  for (const item of validItems) {
    modal += item.unit_cost * item.qty;

    if (!productSalesMap[item.product_id]) {
      productSalesMap[item.product_id] = {
        name: item.product_name,
        qty: 0,
        totalOmzet: 0,
      };
    }
    productSalesMap[item.product_id].qty += item.qty;
    productSalesMap[item.product_id].totalOmzet += item.qty * item.unit_price;
  }

  const untung = omzet - modal;
  const transactionCount = validSales.length;
  const averagePerTransaction =
    transactionCount > 0 ? Math.round(omzet / transactionCount) : 0;

  // Waste cost: sum(|qty| * unit_cost)
  const wasteCost = wasteMovements.reduce(
    (acc, m) => acc + Math.abs(m.qty) * m.unit_cost,
    0
  );

  const bestSellers: BestSellerItem[] = Object.entries(productSalesMap)
    .map(([productId, val]) => ({
      productId,
      productName: val.name,
      qty: val.qty,
      totalOmzet: val.totalOmzet,
    }))
    .sort((a, b) => b.qty - a.qty);

  return {
    summary: {
      omzet,
      modal,
      untung,
      transactionCount,
      averagePerTransaction,
      wasteCost,
    },
    bestSellers,
    paymentBreakdown,
  };
}
