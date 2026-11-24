import { z } from "zod";

export const CommonFieldsSchema = z.object({
  id: z.string(),
  owner_id: z.string().nullable().default(null),
  created_at: z.string(),
  device_id: z.string().default("default"),
});

export const SettingsSchema = z.object({
  id: z.string(),
  business_name: z.string().min(1, "Nama usaha wajib diisi"),
  address: z.string().default(""),
  phone: z.string().default(""),
  receipt_footer: z.string().default("Terima kasih atas kunjungannya!"),
  timezone: z.string().default("Asia/Jakarta"),
  low_stock_threshold_default: z.number().int().nonnegative().default(10),
  device_label: z.string().default("A"),
  pin_hash: z.string().nullable().default(null),
  auto_return_seconds: z.number().int().nonnegative().default(8),
  qris_image: z.string().nullable().default(null),
  updated_at: z.string(),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const ProductKindSchema = z.enum(["single", "bundle"]);
export type ProductKind = z.infer<typeof ProductKindSchema>;

export const ProductSchema = CommonFieldsSchema.extend({
  name: z.string().min(1, "Nama produk wajib diisi"),
  category: z.string().default("Risol"),
  kind: ProductKindSchema,
  base_product_id: z.string().nullable().default(null),
  unit_qty: z.number().int().min(1).default(1),
  price: z.number().int().nonnegative("Harga tidak boleh negatif"),
  cost_price: z.number().int().nonnegative("Modal tidak boleh negatif").default(0),
  track_stock: z.boolean().default(true),
  low_stock_threshold: z.number().int().nullable().default(null),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  photo: z.string().nullable().default(null),
  updated_at: z.string(),
  deleted_at: z.string().nullable().default(null),
}).refine(
  (data) => {
    if (data.kind === "bundle" && !data.base_product_id) {
      return false;
    }
    return true;
  },
  {
    message: "Paket (bundle) wajib memilih produk dasar",
    path: ["base_product_id"],
  }
);
export type Product = z.infer<typeof ProductSchema>;

export const PaymentMethodSchema = z.enum(["cash", "qris", "transfer"]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const SaleSourceSchema = z.enum(["pos", "preorder"]);
export type SaleSource = z.infer<typeof SaleSourceSchema>;

export const SaleSchema = CommonFieldsSchema.extend({
  receipt_no: z.string(),
  business_date: z.string(), // YYYY-MM-DD
  subtotal: z.number().int().nonnegative(),
  discount: z.number().int().nonnegative().default(0),
  total: z.number().int().nonnegative(),
  deposit_applied: z.number().int().nonnegative().default(0),
  payment_method: PaymentMethodSchema,
  paid_amount: z.number().int().nonnegative(),
  change_amount: z.number().int().nonnegative(),
  source: SaleSourceSchema.default("pos"),
  preorder_id: z.string().nullable().default(null),
  note: z.string().nullable().default(null),
});
export type Sale = z.infer<typeof SaleSchema>;

export const SaleItemSchema = z.object({
  id: z.string(),
  sale_id: z.string(),
  product_id: z.string(),
  product_name: z.string(),
  qty: z.number().int().min(1),
  unit_price: z.number().int().nonnegative(),
  unit_cost: z.number().int().nonnegative(),
  stock_product_id: z.string(),
  stock_qty: z.number().int().min(1),
});
export type SaleItem = z.infer<typeof SaleItemSchema>;

export const VoidReasonSchema = z.enum(["salah_input", "batal_pembeli", "lainnya"]);
export type VoidReason = z.infer<typeof VoidReasonSchema>;

export const SaleVoidSchema = z.object({
  id: z.string(),
  sale_id: z.string(),
  reason: VoidReasonSchema,
  note: z.string().nullable().default(null),
  created_at: z.string(),
});
export type SaleVoid = z.infer<typeof SaleVoidSchema>;

export const StockMovementTypeSchema = z.enum([
  "production",
  "sale",
  "sale_void",
  "waste",
  "adjustment",
  "consignment_out",
  "consignment_return",
]);
export type StockMovementType = z.infer<typeof StockMovementTypeSchema>;

export const StockMovementSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  type: StockMovementTypeSchema,
  qty: z.number().int(), // signed
  unit_cost: z.number().int().nonnegative().default(0),
  business_date: z.string(),
  ref_type: z.string().nullable().default(null),
  ref_id: z.string().nullable().default(null),
  reason: z.string().nullable().default(null),
  note: z.string().nullable().default(null),
  created_at: z.string(),
});
export type StockMovement = z.infer<typeof StockMovementSchema>;

export const PreorderStatusSchema = z.enum([
  "new",
  "in_production",
  "ready",
  "done",
  "cancelled",
]);
export type PreorderStatus = z.infer<typeof PreorderStatusSchema>;

export const PreorderSchema = CommonFieldsSchema.extend({
  customer_name: z.string().min(1, "Nama pelanggan wajib diisi"),
  phone: z.string().default(""),
  pickup_at: z.string(),
  status: PreorderStatusSchema.default("new"),
  deposit: z.number().int().nonnegative().default(0),
  total: z.number().int().nonnegative().default(0),
  note: z.string().nullable().default(null),
  sale_id: z.string().nullable().default(null),
  updated_at: z.string(),
  deleted_at: z.string().nullable().default(null),
});
export type Preorder = z.infer<typeof PreorderSchema>;

export const PreorderItemSchema = z.object({
  id: z.string(),
  preorder_id: z.string(),
  product_id: z.string(),
  product_name: z.string(),
  qty: z.number().int().min(1),
  unit_price: z.number().int().nonnegative(),
});
export type PreorderItem = z.infer<typeof PreorderItemSchema>;

export const PartnerSchema = CommonFieldsSchema.extend({
  name: z.string().min(1, "Nama mitra wajib diisi"),
  contact: z.string().default(""),
  note: z.string().nullable().default(null),
  is_active: z.boolean().default(true),
  updated_at: z.string(),
  deleted_at: z.string().nullable().default(null),
});
export type Partner = z.infer<typeof PartnerSchema>;

export const PartnerPriceSchema = z.object({
  id: z.string(),
  partner_id: z.string(),
  product_id: z.string(),
  price: z.number().int().nonnegative(),
});
export type PartnerPrice = z.infer<typeof PartnerPriceSchema>;

export const ConsignmentDropSchema = z.object({
  id: z.string(),
  partner_id: z.string(),
  drop_date: z.string(),
  note: z.string().nullable().default(null),
  created_at: z.string(),
});
export type ConsignmentDrop = z.infer<typeof ConsignmentDropSchema>;

export const ConsignmentDropItemSchema = z.object({
  id: z.string(),
  drop_id: z.string(),
  product_id: z.string(),
  qty: z.number().int().min(1),
});
export type ConsignmentDropItem = z.infer<typeof ConsignmentDropItemSchema>;

export const SettlementStatusSchema = z.enum(["unpaid", "paid"]);
export type SettlementStatus = z.infer<typeof SettlementStatusSchema>;

export const ConsignmentSettlementSchema = z.object({
  id: z.string(),
  partner_id: z.string(),
  period_start: z.string(),
  period_end: z.string(),
  total_due: z.number().int().nonnegative(),
  status: SettlementStatusSchema.default("unpaid"),
  paid_at: z.string().nullable().default(null),
  note: z.string().nullable().default(null),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ConsignmentSettlement = z.infer<typeof ConsignmentSettlementSchema>;

export const ConsignmentSettlementItemSchema = z.object({
  id: z.string(),
  settlement_id: z.string(),
  product_id: z.string(),
  sold_qty: z.number().int().nonnegative(),
  returned_qty: z.number().int().nonnegative(),
  unit_price: z.number().int().nonnegative(),
  unit_cost: z.number().int().nonnegative(),
  amount: z.number().int().nonnegative(),
});
export type ConsignmentSettlementItem = z.infer<typeof ConsignmentSettlementItemSchema>;

export const OutboxSchema = z.object({
  seq: z.number().int().optional(),
  table: z.string(),
  row_id: z.string(),
  op: z.enum(["insert", "upsert"]),
  payload: z.record(z.unknown()),
  attempts: z.number().int().default(0),
  status: z.enum(["pending", "dead"]).default("pending"),
  last_error: z.string().nullable().default(null),
  created_at: z.string(),
});
export type Outbox = z.infer<typeof OutboxSchema>;

export const SyncStateSchema = z.object({
  table: z.string(),
  cursor: z.string().default(""),
  last_synced_at: z.string().nullable().default(null),
});
export type SyncState = z.infer<typeof SyncStateSchema>;
