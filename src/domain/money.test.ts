import { describe, it, expect } from "vitest";
import {
  formatRupiah,
  parseRupiah,
  calculateTotal,
  calculateChange,
  getQuickCashOptions,
} from "./money";

describe("Domain Money", () => {
  it("formats integer to Indonesian Rupiah", () => {
    const formatted = formatRupiah(15000);
    // Node / browsers might use non-breaking space or standard space
    expect(formatted.replace(/\s/g, " ")).toContain("Rp");
    expect(formatted.replace(/\s/g, " ")).toContain("15.000");
  });

  it("parses formatted string to integer", () => {
    expect(parseRupiah("Rp 15.000")).toBe(15000);
    expect(parseRupiah("25.500,00")).toBe(2550000); // Only digits, intended for clean integer inputs
    expect(parseRupiah("")).toBe(0);
  });

  it("calculates total with discount", () => {
    expect(calculateTotal(10000, 2000)).toBe(8000);
    expect(calculateTotal(10000, 15000)).toBe(0); // non-negative
  });

  it("calculates change correctly", () => {
    // 3 x 3000 = 9000, bayar 10000 -> kembalian 1000
    expect(calculateChange(10000, 9000)).toBe(1000);
    // with deposit: total 15000, DP 5000, paid 10000 -> change 0
    expect(calculateChange(10000, 15000, 5000)).toBe(0);
    // with deposit: total 15000, DP 5000, paid 20000 -> change 10000
    expect(calculateChange(20000, 15000, 5000)).toBe(10000);
    // underpaid returns 0
    expect(calculateChange(5000, 10000)).toBe(0);
  });

  it("generates dynamic quick cash options", () => {
    const options = getQuickCashOptions(9000);
    expect(options[0]).toBe(10000);
    expect(options).toContain(20000);
    expect(options).toContain(50000);
  });
});
