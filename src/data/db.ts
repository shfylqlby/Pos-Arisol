import Dexie, { type Table } from "dexie";
import type {
  Settings,
  Product,
  Sale,
  SaleItem,
  SaleVoid,
  StockMovement,
  Preorder,
  PreorderItem,
  Partner,
  PartnerPrice,
  ConsignmentDrop,
  ConsignmentDropItem,
  ConsignmentSettlement,
  ConsignmentSettlementItem,
  Outbox,
  SyncState,
} from "./schemas";

export class PosDatabase extends Dexie {
  settings!: Table<Settings, string>;
  products!: Table<Product, string>;
  sales!: Table<Sale, string>;
  sale_items!: Table<SaleItem, string>;
  sale_voids!: Table<SaleVoid, string>;
  stock_movements!: Table<StockMovement, string>;
  preorders!: Table<Preorder, string>;
  preorder_items!: Table<PreorderItem, string>;
  partners!: Table<Partner, string>;
  partner_prices!: Table<PartnerPrice, string>;
  consignment_drops!: Table<ConsignmentDrop, string>;
  consignment_drop_items!: Table<ConsignmentDropItem, string>;
  consignment_settlements!: Table<ConsignmentSettlement, string>;
  consignment_settlement_items!: Table<ConsignmentSettlementItem, string>;
  outbox!: Table<Outbox, number>;
  sync_state!: Table<SyncState, string>;

  constructor() {
    super("PosRisolDB");
    this.version(1).stores({
      settings: "id",
      products: "id, kind, is_active, sort_order, deleted_at",
      sales: "id, business_date, created_at, receipt_no, preorder_id",
      sale_items: "id, sale_id, product_id, stock_product_id",
      sale_voids: "id, &sale_id",
      stock_movements:
        "id, product_id, business_date, type, [product_id+business_date], ref_id",
      preorders: "id, pickup_at, status, deleted_at",
      preorder_items: "id, preorder_id",
      partners: "id, is_active, deleted_at",
      partner_prices: "id, [partner_id+product_id]",
      consignment_drops: "id, partner_id, drop_date",
      consignment_drop_items: "id, drop_id",
      consignment_settlements: "id, partner_id, status, period_end",
      consignment_settlement_items: "id, settlement_id",
      outbox: "++seq, status, table",
      sync_state: "table",
    });
    this.version(2).stores({
      settings: "id",
      products: "id, kind, is_active, sort_order, deleted_at",
      sales: "id, business_date, created_at, receipt_no, preorder_id",
      sale_items: "id, sale_id, product_id, stock_product_id",
      sale_voids: "id, &sale_id",
      stock_movements:
        "id, product_id, business_date, created_at, type, [product_id+business_date], ref_id",
      preorders: "id, pickup_at, status, deleted_at",
      preorder_items: "id, preorder_id",
      partners: "id, is_active, deleted_at",
      partner_prices: "id, [partner_id+product_id]",
      consignment_drops: "id, partner_id, drop_date",
      consignment_drop_items: "id, drop_id",
      consignment_settlements: "id, partner_id, status, period_end",
      consignment_settlement_items: "id, settlement_id",
      outbox: "++seq, status, table",
      sync_state: "table",
    });
  }
}

export const db = new PosDatabase();
