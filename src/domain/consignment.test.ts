import { describe, it, expect } from "vitest";
import { calculateRemainingAtPartner, calculateSettlementDue } from "./consignment";

describe("Domain Consignment", () => {
  it("calculates remaining quantity at partner", () => {
    // 50 dropped, 30 sold, 5 returned -> 15 remaining
    expect(calculateRemainingAtPartner(50, 30, 5)).toBe(15);
    expect(calculateRemainingAtPartner(10, 10, 0)).toBe(0);
  });

  it("calculates settlement due total", () => {
    const items = [
      { soldQty: 20, unitPrice: 2500 },
      { soldQty: 10, unitPrice: 2000 },
    ];
    // 20 * 2500 + 10 * 2000 = 50000 + 20000 = 70000
    expect(calculateSettlementDue(items)).toBe(70000);
  });
});
