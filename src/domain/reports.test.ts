import { describe, it, expect } from "vitest";
import { computeReport } from "./reports";
import type { Sale, SaleItem, StockMovement } from "@/data/schemas";

describe("Domain Reports", () => {
  it("calculates omzet, modal, untung, ignoring void sales", () => {
    const sales: Sale[] = [
      {
        id: "s1",
        owner_id: null,
        device_id: "A",
        receipt_no: "A-0001",
        business_date: "2026-11-25",
        subtotal: 10000,
        discount: 0,
        total: 10000,
        deposit_applied: 0,
        payment_method: "cash",
        paid_amount: 10000,
        change_amount: 0,
        source: "pos",
        preorder_id: null,
        note: null,
        created_at: "2026-11-25T01:00:00Z",
      },
      {
        id: "s2",
        owner_id: null,
        device_id: "A",
        receipt_no: "A-0002",
        business_date: "2026-11-25",
        subtotal: 20000,
        discount: 2000,
        total: 18000,
        deposit_applied: 0,
        payment_method: "qris",
        paid_amount: 18000,
        change_amount: 0,
        source: "pos",
        preorder_id: null,
        note: null,
        created_at: "2026-11-25T02:00:00Z",
      },
      {
        // voided
        id: "s3",
        owner_id: null,
        device_id: "A",
        receipt_no: "A-0003",
        business_date: "2026-11-25",
        subtotal: 50000,
        discount: 0,
        total: 50000,
        deposit_applied: 0,
        payment_method: "cash",
        paid_amount: 50000,
        change_amount: 0,
        source: "pos",
        preorder_id: null,
        note: null,
        created_at: "2026-11-25T03:00:00Z",
      },
    ];

    const saleItems: SaleItem[] = [
      // s1: 2 items @ 3000 modal 1800 + 1 item @ 4000 modal 2000
      {
        id: "i1",
        sale_id: "s1",
        product_id: "p1",
        product_name: "Risol Mayo",
        qty: 2,
        unit_price: 3000,
        unit_cost: 1800,
        stock_product_id: "p1",
        stock_qty: 2,
      },
      {
        id: "i2",
        sale_id: "s1",
        product_id: "p2",
        product_name: "Risol Ragout",
        qty: 1,
        unit_price: 4000,
        unit_cost: 2000,
        stock_product_id: "p2",
        stock_qty: 1,
      },
      // s2: 1 bundle @ 20000 modal 12000
      {
        id: "i3",
        sale_id: "s2",
        product_id: "b1",
        product_name: "Paket 5",
        qty: 1,
        unit_price: 20000,
        unit_cost: 12000,
        stock_product_id: "p1",
        stock_qty: 5,
      },
      // s3 item (voided)
      {
        id: "i4",
        sale_id: "s3",
        product_id: "p1",
        product_name: "Risol Mayo",
        qty: 10,
        unit_price: 5000,
        unit_cost: 3000,
        stock_product_id: "p1",
        stock_qty: 10,
      },
    ];

    const voidSaleIds = new Set(["s3"]);

    const wasteMovements: StockMovement[] = [
      {
        id: "w1",
        product_id: "p1",
        type: "waste",
        qty: -3,
        unit_cost: 1800,
        business_date: "2026-11-25",
        ref_type: "closing",
        ref_id: "c1",
        reason: "Basi",
        note: null,
        created_at: "2026-11-25T12:00:00Z",
      },
    ];

    const report = computeReport(sales, saleItems, voidSaleIds, wasteMovements);

    // Omzet = s1 (10000) + s2 (18000) = 28000
    expect(report.summary.omzet).toBe(28000);
    // Modal = (2*1800 + 1*2000) + 12000 = 3600 + 2000 + 12000 = 17600
    expect(report.summary.modal).toBe(17600);
    // Untung = 28000 - 17600 = 10400
    expect(report.summary.untung).toBe(10400);
    expect(report.summary.transactionCount).toBe(2);
    expect(report.summary.averagePerTransaction).toBe(14000);
    // Waste = 3 * 1800 = 5400
    expect(report.summary.wasteCost).toBe(5400);

    // Best sellers
    expect(report.bestSellers[0].productName).toBe("Risol Mayo");
    expect(report.bestSellers[0].qty).toBe(2);
  });
});
