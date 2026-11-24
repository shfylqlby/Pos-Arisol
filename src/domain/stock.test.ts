import { describe, it, expect } from "vitest";
import {
  calculateStock,
  calculateStockSummary,
  getStockStatus,
  computeClosingMovements,
} from "./stock";

describe("Domain Stock", () => {
  it("calculates total stock from signed movements", () => {
    const movements = [
      { qty: 50 }, // produksi
      { qty: -10 }, // jual
      { qty: -5 }, // jual
      { qty: 5 }, // void
      { qty: -2 }, // waste
    ];
    expect(calculateStock(movements)).toBe(38);
  });

  it("calculates today summary accurately", () => {
    const today = "2026-11-25";
    const movements = [
      { product_id: "p1", qty: 40, type: "production", unit_cost: 1800, business_date: today },
      { product_id: "p1", qty: -15, type: "sale", unit_cost: 1800, business_date: today },
      { product_id: "p1", qty: 5, type: "sale_void", unit_cost: 1800, business_date: today },
      { product_id: "p1", qty: -2, type: "waste", unit_cost: 1800, business_date: today },
      // yesterday
      { product_id: "p1", qty: 20, type: "production", unit_cost: 1800, business_date: "2026-11-24" },
    ];

    const summary = calculateStockSummary(movements, today);
    expect(summary.currentStock).toBe(48);
    expect(summary.producedToday).toBe(40);
    expect(summary.soldToday).toBe(10); // 15 - 5 void
    expect(summary.wasteToday).toBe(2);
  });

  it("checks threshold status", () => {
    expect(getStockStatus(0, 10).status).toBe("out_of_stock");
    expect(getStockStatus(5, 10).status).toBe("low_stock");
    expect(getStockStatus(15, 10).status).toBe("normal");
  });

  it("computes closing day movements correctly", () => {
    const today = "2026-11-25";
    const items = [
      {
        productId: "p1",
        systemStock: 20,
        physicalStock: 15,
        difference: -5,
        unitCost: 1800,
        reason: "Basi",
      },
      {
        productId: "p2",
        systemStock: 10,
        physicalStock: 12,
        difference: 2,
        unitCost: 1500,
      },
    ];

    const movements = computeClosingMovements(items, today);
    expect(movements).toHaveLength(2);
    expect(movements[0].type).toBe("waste");
    expect(movements[0].qty).toBe(-5);
    expect(movements[1].type).toBe("adjustment");
    expect(movements[1].qty).toBe(2);
  });
});
