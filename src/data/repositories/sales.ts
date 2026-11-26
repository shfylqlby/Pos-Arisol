import { db } from "../db";
import type {
  Sale,
  SaleItem,
  SaleVoid,
  StockMovement,
  PaymentMethod,
  VoidReason,
} from "../schemas";
import { recordOutbox } from "../sync/outbox";
import { createId } from "@/lib/id";
import { getNowISO, getBusinessDate } from "@/lib/date";
import { getSettings } from "./settings";
import type { CartState } from "@/domain/cart";
import { calculateCartTotals } from "@/domain/cart";

export interface CreateSaleParams {
  cart: CartState;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  changeAmount: number;
  depositApplied?: number;
  source?: "pos" | "preorder";
  preorderId?: string | null;
  note?: string | null;
  businessDate?: string;
}

export async function generateNextReceiptNo(
  businessDate: string,
  deviceLabel: string
): Promise<string> {
  const salesToday = await db.sales.where("business_date").equals(businessDate).toArray();

  const prefix = `${deviceLabel}-`;
  const matching = salesToday.filter((s) => s.receipt_no.startsWith(prefix));
  const nextSeq = matching.length + 1;
  return `${prefix}${nextSeq.toString().padStart(4, "0")}`;
}

export async function createSale(params: CreateSaleParams): Promise<{
  sale: Sale;
  items: SaleItem[];
}> {
  const settings = await getSettings();
  const businessDate =
    params.businessDate || getBusinessDate(new Date(), settings.timezone);
  const now = getNowISO();
  const saleId = createId();

  const totals = calculateCartTotals(params.cart);
  const receiptNo = await generateNextReceiptNo(businessDate, settings.device_label);

  const sale: Sale = {
    id: saleId,
    owner_id: null,
    device_id: settings.device_label,
    receipt_no: receiptNo,
    business_date: businessDate,
    subtotal: totals.subtotal,
    discount: totals.discount,
    total: totals.total,
    deposit_applied: params.depositApplied || 0,
    payment_method: params.paymentMethod,
    paid_amount: params.paidAmount,
    change_amount: params.changeAmount,
    source: params.source || "pos",
    preorder_id: params.preorderId || null,
    note: params.note || null,
    created_at: now,
  };

  const saleItems: SaleItem[] = params.cart.items.map((item) => ({
    id: createId(),
    sale_id: saleId,
    product_id: item.product.id,
    product_name: item.product.name,
    qty: item.qty,
    unit_price: item.unitPrice,
    unit_cost: item.unitCost,
    stock_product_id: item.stockProductId,
    stock_qty: item.stockQty,
  }));

  const stockMovements: StockMovement[] = saleItems.map((item) => ({
    id: createId(),
    product_id: item.stock_product_id,
    type: "sale",
    qty: -Math.abs(item.stock_qty), // negative
    unit_cost: item.unit_cost,
    business_date: businessDate,
    ref_type: "sale",
    ref_id: saleId,
    reason: null,
    note: `Penjualan ${receiptNo}`,
    created_at: now,
  }));

  await db.transaction(
    "rw",
    [db.sales, db.sale_items, db.stock_movements, db.outbox],
    async () => {
      await db.sales.add(sale);
      await recordOutbox(
        "sales",
        sale.id,
        "insert",
        sale as unknown as Record<string, unknown>
      );

      for (const item of saleItems) {
        await db.sale_items.add(item);
        await recordOutbox(
          "sale_items",
          item.id,
          "insert",
          item as unknown as Record<string, unknown>
        );
      }

      for (const sm of stockMovements) {
        await db.stock_movements.add(sm);
        await recordOutbox(
          "stock_movements",
          sm.id,
          "insert",
          sm as unknown as Record<string, unknown>
        );
      }
    }
  );

  return { sale, items: saleItems };
}

export async function voidSale(
  saleId: string,
  reason: VoidReason,
  note?: string
): Promise<SaleVoid> {
  const sale = await db.sales.get(saleId);
  if (!sale) throw new Error("Transaksi tidak ditemukan");

  const existingVoid = await db.sale_voids.where("sale_id").equals(saleId).first();
  if (existingVoid) throw new Error("Transaksi sudah pernah dibatalkan (void)");

  const items = await db.sale_items.where("sale_id").equals(saleId).toArray();
  const now = getNowISO();

  const saleVoid: SaleVoid = {
    id: createId(),
    sale_id: saleId,
    reason,
    note: note || null,
    created_at: now,
  };

  const reversalMovements: StockMovement[] = items.map((item) => ({
    id: createId(),
    product_id: item.stock_product_id,
    type: "sale_void",
    qty: Math.abs(item.stock_qty), // positive reversal
    unit_cost: item.unit_cost,
    business_date: sale.business_date,
    ref_type: "sale_void",
    ref_id: saleId,
    reason,
    note: `Void ${sale.receipt_no}`,
    created_at: now,
  }));

  await db.transaction("rw", [db.sale_voids, db.stock_movements, db.outbox], async () => {
    await db.sale_voids.add(saleVoid);
    await recordOutbox(
      "sale_voids",
      saleVoid.id,
      "insert",
      saleVoid as unknown as Record<string, unknown>
    );

    for (const sm of reversalMovements) {
      await db.stock_movements.add(sm);
      await recordOutbox(
        "stock_movements",
        sm.id,
        "insert",
        sm as unknown as Record<string, unknown>
      );
    }
  });

  return saleVoid;
}

export async function getSaleWithDetails(saleId: string): Promise<{
  sale: Sale;
  items: SaleItem[];
  voidRecord?: SaleVoid;
} | null> {
  const sale = await db.sales.get(saleId);
  if (!sale) return null;

  const items = await db.sale_items.where("sale_id").equals(saleId).toArray();
  const voidRecord = await db.sale_voids.where("sale_id").equals(saleId).first();

  return { sale, items, voidRecord };
}

export async function getDayOmzet(businessDate: string): Promise<number> {
  const sales = await db.sales.where("business_date").equals(businessDate).toArray();
  const voidIds = new Set((await db.sale_voids.toArray()).map((v) => v.sale_id));
  return sales.filter((s) => !voidIds.has(s.id)).reduce((acc, s) => acc + s.total, 0);
}

export async function listSales(
  businessDate?: string,
  limit: number = 100
): Promise<
  {
    sale: Sale;
    isVoid: boolean;
  }[]
> {
  let sales: Sale[];
  if (businessDate) {
    sales = await db.sales
      .where("business_date")
      .equals(businessDate)
      .reverse()
      .sortBy("created_at");
  } else {
    sales = await db.sales.orderBy("created_at").reverse().limit(limit).toArray();
  }

  const voidIds = new Set((await db.sale_voids.toArray()).map((v) => v.sale_id));

  return sales.map((sale) => ({
    sale,
    isVoid: voidIds.has(sale.id),
  }));
}
