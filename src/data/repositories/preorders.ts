import { db } from "../db";
import type { Preorder, PreorderItem, PreorderStatus, PaymentMethod } from "../schemas";
import { recordOutbox } from "../sync/outbox";
import { createId } from "@/lib/id";
import { getNowISO, getBusinessDate } from "@/lib/date";
import { createSale } from "./sales";
import { getProduct } from "./products";

export interface CreatePreorderInput {
  customer_name: string;
  phone: string;
  pickup_at: string;
  deposit: number;
  note?: string | null;
  items: {
    product_id: string;
    qty: number;
  }[];
}

export async function createPreorder(
  input: CreatePreorderInput
): Promise<{ preorder: Preorder; items: PreorderItem[] }> {
  const preorderId = createId();
  const now = getNowISO();

  let total = 0;
  const items: PreorderItem[] = [];

  for (const item of input.items) {
    const product = await getProduct(item.product_id);
    if (!product) continue;
    const itemTotal = item.qty * product.price;
    total += itemTotal;
    items.push({
      id: createId(),
      preorder_id: preorderId,
      product_id: product.id,
      product_name: product.name,
      qty: item.qty,
      unit_price: product.price,
    });
  }

  const preorder: Preorder = {
    id: preorderId,
    owner_id: null,
    device_id: "default",
    customer_name: input.customer_name,
    phone: input.phone,
    pickup_at: input.pickup_at,
    status: "new",
    deposit: input.deposit,
    total,
    note: input.note || null,
    sale_id: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  await db.transaction("rw", [db.preorders, db.preorder_items, db.outbox], async () => {
    await db.preorders.add(preorder);
    await recordOutbox(
      "preorders",
      preorder.id,
      "insert",
      preorder as unknown as Record<string, unknown>
    );

    for (const it of items) {
      await db.preorder_items.add(it);
      await recordOutbox(
        "preorder_items",
        it.id,
        "insert",
        it as unknown as Record<string, unknown>
      );
    }
  });

  return { preorder, items };
}

export async function updatePreorderStatus(
  id: string,
  status: PreorderStatus
): Promise<Preorder> {
  const preorder = await db.preorders.get(id);
  if (!preorder) throw new Error("Preorder tidak ditemukan");

  const now = getNowISO();
  const updated: Preorder = {
    ...preorder,
    status,
    updated_at: now,
  };

  await db.transaction("rw", [db.preorders, db.outbox], async () => {
    await db.preorders.put(updated);
    await recordOutbox(
      "preorders",
      updated.id,
      "upsert",
      updated as unknown as Record<string, unknown>
    );
  });

  return updated;
}

export async function completePreorder(
  id: string,
  paymentMethod: PaymentMethod,
  paidAmount: number,
  changeAmount: number
): Promise<{ preorder: Preorder; saleId: string }> {
  const preorder = await db.preorders.get(id);
  if (!preorder) throw new Error("Preorder tidak ditemukan");
  if (preorder.status === "done" && preorder.sale_id) {
    return { preorder, saleId: preorder.sale_id };
  }

  const preorderItems = await db.preorder_items.where("preorder_id").equals(id).toArray();

  // Build cart items for sale creation
  const cartItems = [];
  for (const item of preorderItems) {
    const product = await getProduct(item.product_id);
    if (!product) continue;
    cartItems.push({
      product,
      qty: item.qty,
      unitPrice: item.unit_price,
      unitCost: product.cost_price,
      stockProductId:
        product.kind === "bundle" && product.base_product_id
          ? product.base_product_id
          : product.id,
      stockQty: item.qty * product.unit_qty,
    });
  }

  // Create sale
  const { sale } = await createSale({
    cart: { items: cartItems, discount: 0 },
    paymentMethod,
    paidAmount,
    changeAmount,
    depositApplied: preorder.deposit,
    source: "preorder",
    preorderId: preorder.id,
    note: `Pre-order: ${preorder.customer_name}`,
  });

  // Update preorder
  const now = getNowISO();
  const updatedPreorder: Preorder = {
    ...preorder,
    status: "done",
    sale_id: sale.id,
    updated_at: now,
  };

  await db.transaction("rw", [db.preorders, db.outbox], async () => {
    await db.preorders.put(updatedPreorder);
    await recordOutbox(
      "preorders",
      updatedPreorder.id,
      "upsert",
      updatedPreorder as unknown as Record<string, unknown>
    );
  });

  return { preorder: updatedPreorder, saleId: sale.id };
}

export async function listPreorders(): Promise<
  {
    preorder: Preorder;
    items: PreorderItem[];
  }[]
> {
  const list = await db.preorders
    .filter((p) => p.deleted_at === null)
    .reverse()
    .sortBy("pickup_at");

  const results = [];
  for (const preorder of list) {
    const items = await db.preorder_items
      .where("preorder_id")
      .equals(preorder.id)
      .toArray();
    results.push({ preorder, items });
  }
  return results;
}
