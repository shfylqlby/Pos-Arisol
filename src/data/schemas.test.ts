import { describe, expect, it } from "vitest";
import { ProductSchema } from "./schemas";

const base = {
  id: "01J00000000000000000000000",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  name: "Paket Hemat",
  kind: "bundle" as const,
  price: 10000,
};

describe("ProductSchema", () => {
  it("menolak bundle tanpa base_product_id", () => {
    const result = ProductSchema.safeParse(base);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["base_product_id"]);
    }
  });

  it("menerima bundle dengan base_product_id", () => {
    const result = ProductSchema.safeParse({
      ...base,
      base_product_id: "01J00000000000000000000001",
    });
    expect(result.success).toBe(true);
  });

  it("menerima produk single tanpa base_product_id", () => {
    const result = ProductSchema.safeParse({
      ...base,
      kind: "single",
      name: "Risol Mayo",
      price: 3000,
    });
    expect(result.success).toBe(true);
  });

  it("menolak harga negatif", () => {
    const result = ProductSchema.safeParse({
      ...base,
      kind: "single",
      price: -1,
    });
    expect(result.success).toBe(false);
  });
});
