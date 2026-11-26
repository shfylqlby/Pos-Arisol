import { db } from "../db";
import type {
  Partner,
  PartnerPrice,
  ConsignmentDrop,
  ConsignmentDropItem,
  ConsignmentSettlement,
  ConsignmentSettlementItem,
  StockMovement,
} from "../schemas";
import { recordOutbox } from "../sync/outbox";
import { createId } from "@/lib/id";
import { getNowISO, getBusinessDate } from "@/lib/date";
import { getProduct } from "./products";

export async function listPartners(): Promise<Partner[]> {
  const all = await db.partners.filter((p) => p.deleted_at === null).toArray();
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPartner(id: string): Promise<Partner | undefined> {
  const partner = await db.partners.get(id);
  if (partner && partner.deleted_at === null) return partner;
  return undefined;
}

export async function savePartner(
  data: Omit<
    Partner,
    "id" | "created_at" | "updated_at" | "deleted_at" | "device_id" | "owner_id"
  > & {
    id?: string;
  }
): Promise<Partner> {
  const now = getNowISO();
  const id = data.id || createId();
  const existing = data.id ? await db.partners.get(data.id) : undefined;

  const partner: Partner = {
    ...data,
    id,
    owner_id: existing?.owner_id ?? null,
    device_id: existing?.device_id ?? "default",
    created_at: existing?.created_at ?? now,
    updated_at: now,
    deleted_at: null,
  };

  await db.transaction("rw", [db.partners, db.outbox], async () => {
    await db.partners.put(partner);
    await recordOutbox(
      "partners",
      partner.id,
      "upsert",
      partner as unknown as Record<string, unknown>
    );
  });

  return partner;
}

export async function getPartnerPrices(partnerId: string): Promise<PartnerPrice[]> {
  return db.partner_prices.where("partner_id").equals(partnerId).toArray();
}

export async function listSettlements(
  partnerId: string
): Promise<ConsignmentSettlement[]> {
  const list = await db.consignment_settlements
    .where("partner_id")
    .equals(partnerId)
    .toArray();
  return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function setPartnerPrice(
  partnerId: string,
  productId: string,
  price: number
): Promise<PartnerPrice> {
  const existing = await db.partner_prices
    .where("[partner_id+product_id]")
    .equals([partnerId, productId])
    .first();

  const id = existing?.id || createId();
  const record: PartnerPrice = {
    id,
    partner_id: partnerId,
    product_id: productId,
    price,
  };

  await db.transaction("rw", [db.partner_prices, db.outbox], async () => {
    await db.partner_prices.put(record);
    await recordOutbox(
      "partner_prices",
      record.id,
      "upsert",
      record as unknown as Record<string, unknown>
    );
  });

  return record;
}

export async function recordDrop(
  partnerId: string,
  items: { productId: string; qty: number }[],
  dropDate: string = getBusinessDate(),
  note?: string
): Promise<ConsignmentDrop> {
  const dropId = createId();
  const now = getNowISO();

  const drop: ConsignmentDrop = {
    id: dropId,
    partner_id: partnerId,
    drop_date: dropDate,
    note: note || null,
    created_at: now,
  };

  const dropItems: ConsignmentDropItem[] = [];
  const stockMovements: StockMovement[] = [];

  for (const it of items) {
    const product = await getProduct(it.productId);
    const unitCost = product ? product.cost_price : 0;
    const stockProductId =
      product?.kind === "bundle" && product.base_product_id
        ? product.base_product_id
        : it.productId;

    dropItems.push({
      id: createId(),
      drop_id: dropId,
      product_id: it.productId,
      qty: it.qty,
    });

    stockMovements.push({
      id: createId(),
      product_id: stockProductId,
      type: "consignment_out",
      qty: -Math.abs(it.qty), // negative: stock out
      unit_cost: unitCost,
      business_date: dropDate,
      ref_type: "consignment_drop",
      ref_id: dropId,
      reason: null,
      note: `Drop titip jual ke mitra`,
      created_at: now,
    });
  }

  await db.transaction(
    "rw",
    [db.consignment_drops, db.consignment_drop_items, db.stock_movements, db.outbox],
    async () => {
      await db.consignment_drops.add(drop);
      await recordOutbox(
        "consignment_drops",
        drop.id,
        "insert",
        drop as unknown as Record<string, unknown>
      );

      for (const item of dropItems) {
        await db.consignment_drop_items.add(item);
        await recordOutbox(
          "consignment_drop_items",
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

  return drop;
}

export async function recordSettlement(
  partnerId: string,
  periodStart: string,
  periodEnd: string,
  items: {
    productId: string;
    soldQty: number;
    returnedQty: number;
    unitPrice: number;
  }[],
  note?: string
): Promise<ConsignmentSettlement> {
  const settlementId = createId();
  const now = getNowISO();

  let totalDue = 0;
  const settlementItems: ConsignmentSettlementItem[] = [];
  const stockMovements: StockMovement[] = [];

  for (const it of items) {
    const product = await getProduct(it.productId);
    const unitCost = product ? product.cost_price : 0;
    const stockProductId =
      product?.kind === "bundle" && product.base_product_id
        ? product.base_product_id
        : it.productId;

    const amount = it.soldQty * it.unitPrice;
    totalDue += amount;

    settlementItems.push({
      id: createId(),
      settlement_id: settlementId,
      product_id: it.productId,
      sold_qty: it.soldQty,
      returned_qty: it.returnedQty,
      unit_price: it.unitPrice,
      unit_cost: unitCost,
      amount,
    });

    if (it.returnedQty > 0) {
      stockMovements.push({
        id: createId(),
        product_id: stockProductId,
        type: "consignment_return",
        qty: Math.abs(it.returnedQty), // positive: return to stock
        unit_cost: unitCost,
        business_date: periodEnd,
        ref_type: "consignment_settlement",
        ref_id: settlementId,
        reason: null,
        note: `Retur titip jual`,
        created_at: now,
      });
    }
  }

  const settlement: ConsignmentSettlement = {
    id: settlementId,
    partner_id: partnerId,
    period_start: periodStart,
    period_end: periodEnd,
    total_due: totalDue,
    status: "unpaid",
    paid_at: null,
    note: note || null,
    created_at: now,
    updated_at: now,
  };

  await db.transaction(
    "rw",
    [
      db.consignment_settlements,
      db.consignment_settlement_items,
      db.stock_movements,
      db.outbox,
    ],
    async () => {
      await db.consignment_settlements.add(settlement);
      await recordOutbox(
        "consignment_settlements",
        settlement.id,
        "insert",
        settlement as unknown as Record<string, unknown>
      );

      for (const item of settlementItems) {
        await db.consignment_settlement_items.add(item);
        await recordOutbox(
          "consignment_settlement_items",
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

  return settlement;
}

export async function markSettlementPaid(
  settlementId: string
): Promise<ConsignmentSettlement> {
  const settlement = await db.consignment_settlements.get(settlementId);
  if (!settlement) throw new Error("Setoran tidak ditemukan");

  const now = getNowISO();
  const updated: ConsignmentSettlement = {
    ...settlement,
    status: "paid",
    paid_at: now,
    updated_at: now,
  };

  await db.transaction("rw", [db.consignment_settlements, db.outbox], async () => {
    await db.consignment_settlements.put(updated);
    await recordOutbox(
      "consignment_settlements",
      updated.id,
      "upsert",
      updated as unknown as Record<string, unknown>
    );
  });

  return updated;
}

export async function getConsignmentRevenue(
  startDate: string,
  endDate: string,
  timezone = "Asia/Jakarta"
): Promise<{ total: number; count: number }> {
  const paid = await db.consignment_settlements.where("status").equals("paid").toArray();

  const inRange = paid.filter((s) => {
    if (!s.paid_at) return false;
    const day = getBusinessDate(new Date(s.paid_at), timezone);
    return day >= startDate && day <= endDate;
  });

  return {
    total: inRange.reduce((acc, s) => acc + s.total_due, 0),
    count: inRange.length,
  };
}

export async function getPartnerStockBalance(
  partnerId: string
): Promise<Record<string, number>> {
  const drops = await db.consignment_drops
    .where("partner_id")
    .equals(partnerId)
    .toArray();
  const dropIds = drops.map((d) => d.id);
  const dropItems = await db.consignment_drop_items
    .where("drop_id")
    .anyOf(dropIds)
    .toArray();

  const settlements = await db.consignment_settlements
    .where("partner_id")
    .equals(partnerId)
    .toArray();
  const settlementIds = settlements.map((s) => s.id);
  const settlementItems = await db.consignment_settlement_items
    .where("settlement_id")
    .anyOf(settlementIds)
    .toArray();

  const balance: Record<string, number> = {};

  for (const item of dropItems) {
    balance[item.product_id] = (balance[item.product_id] || 0) + item.qty;
  }

  for (const item of settlementItems) {
    balance[item.product_id] =
      (balance[item.product_id] || 0) - item.sold_qty - item.returned_qty;
  }

  return balance;
}
