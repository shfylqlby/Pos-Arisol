import { db } from "../db";
import { type Product, ProductSchema } from "../schemas";
import { recordOutbox } from "../sync/outbox";
import { createId } from "@/lib/id";
import { getNowISO } from "@/lib/date";

export async function listProducts(includeInactive = false): Promise<Product[]> {
  const collection = db.products.toCollection();
  const all = await collection.toArray();
  return all
    .filter((p) => p.deleted_at === null && (includeInactive || p.is_active))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const product = await db.products.get(id);
  if (product && product.deleted_at === null) {
    return product;
  }
  return undefined;
}

export async function saveProduct(
  data: Omit<Product, "id" | "created_at" | "updated_at" | "deleted_at" | "device_id" | "owner_id"> & {
    id?: string;
  }
): Promise<Product> {
  const now = getNowISO();
  const id = data.id || createId();
  const existing = data.id ? await db.products.get(data.id) : undefined;

  const productData: Product = {
    ...data,
    id,
    owner_id: existing?.owner_id ?? null,
    device_id: existing?.device_id ?? "default",
    created_at: existing?.created_at ?? now,
    updated_at: now,
    deleted_at: null,
  };

  const validated = ProductSchema.parse(productData);

  await db.transaction("rw", [db.products, db.outbox], async () => {
    await db.products.put(validated);
    await recordOutbox(
      "products",
      validated.id,
      "upsert",
      validated as unknown as Record<string, unknown>
    );
  });

  return validated;
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await db.products.get(id);
  if (!existing) return;

  const now = getNowISO();
  const updated: Product = {
    ...existing,
    deleted_at: now,
    updated_at: now,
  };

  await db.transaction("rw", [db.products, db.outbox], async () => {
    await db.products.put(updated);
    await recordOutbox(
      "products",
      updated.id,
      "upsert",
      updated as unknown as Record<string, unknown>
    );
  });
}

export async function reorderProducts(orderedIds: string[]): Promise<void> {
  const now = getNowISO();
  await db.transaction("rw", [db.products, db.outbox], async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      const p = await db.products.get(orderedIds[i]);
      if (p) {
        p.sort_order = i;
        p.updated_at = now;
        await db.products.put(p);
        await recordOutbox(
          "products",
          p.id,
          "upsert",
          p as unknown as Record<string, unknown>
        );
      }
    }
  });
}

export async function initDefaultProducts(): Promise<void> {
  const count = await db.products.count();
  if (count > 0) return;

  const mayoId = createId();
  const ragoutId = createId();
  const sayurId = createId();

  await saveProduct({
    id: mayoId,
    name: "Risol Mayo",
    category: "Risol",
    kind: "single",
    base_product_id: null,
    unit_qty: 1,
    price: 3000,
    cost_price: 1800,
    track_stock: true,
    low_stock_threshold: 10,
    sort_order: 0,
    is_active: true,
    photo: null,
  });

  await saveProduct({
    id: ragoutId,
    name: "Risol Ragout",
    category: "Risol",
    kind: "single",
    base_product_id: null,
    unit_qty: 1,
    price: 3000,
    cost_price: 1800,
    track_stock: true,
    low_stock_threshold: 10,
    sort_order: 1,
    is_active: true,
    photo: null,
  });

  await saveProduct({
    id: sayurId,
    name: "Risol Sayur",
    category: "Risol",
    kind: "single",
    base_product_id: null,
    unit_qty: 1,
    price: 2500,
    cost_price: 1500,
    track_stock: true,
    low_stock_threshold: 10,
    sort_order: 2,
    is_active: true,
    photo: null,
  });

  await saveProduct({
    name: "Paket Mayo Isi 5",
    category: "Paket",
    kind: "bundle",
    base_product_id: mayoId,
    unit_qty: 5,
    price: 14000,
    cost_price: 9000,
    track_stock: false,
    low_stock_threshold: null,
    sort_order: 3,
    is_active: true,
    photo: null,
  });
}
