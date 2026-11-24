import { describe, it, expect } from "vitest";
import {
  createEmptyCart,
  addToCart,
  updateCartItemQty,
  removeCartItem,
  setDiscount,
  calculateCartTotals,
} from "./cart";
import type { Product } from "@/data/schemas";

const singleProduct: Product = {
  id: "p1",
  owner_id: null,
  device_id: "default",
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
  created_at: "2026-11-25T00:00:00Z",
  updated_at: "2026-11-25T00:00:00Z",
  deleted_at: null,
};

const bundleProduct: Product = {
  id: "p2",
  owner_id: null,
  device_id: "default",
  name: "Paket Isi 5",
  category: "Paket",
  kind: "bundle",
  base_product_id: "p1",
  unit_qty: 5,
  price: 14000,
  cost_price: 9000,
  track_stock: false,
  low_stock_threshold: null,
  sort_order: 1,
  is_active: true,
  photo: null,
  created_at: "2026-11-25T00:00:00Z",
  updated_at: "2026-11-25T00:00:00Z",
  deleted_at: null,
};

describe("Domain Cart", () => {
  it("adds single and bundle items and computes correct stockQty", () => {
    let cart = createEmptyCart();
    cart = addToCart(cart, singleProduct, 2);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].qty).toBe(2);
    expect(cart.items[0].stockQty).toBe(2); // 2 * 1
    expect(cart.items[0].stockProductId).toBe("p1");

    // Add bundle: Paket isi 5, qty 2 -> stockQty 10 of p1
    cart = addToCart(cart, bundleProduct, 2);
    expect(cart.items).toHaveLength(2);
    expect(cart.items[1].qty).toBe(2);
    expect(cart.items[1].stockQty).toBe(10); // 2 * 5
    expect(cart.items[1].stockProductId).toBe("p1");

    const totals = calculateCartTotals(cart);
    // subtotal = 2 * 3000 + 2 * 14000 = 6000 + 28000 = 34000
    expect(totals.subtotal).toBe(34000);
    expect(totals.total).toBe(34000);
  });

  it("handles discount correctly", () => {
    let cart = createEmptyCart();
    cart = addToCart(cart, singleProduct, 3); // 9000
    cart = setDiscount(cart, 1000);
    const totals = calculateCartTotals(cart);
    expect(totals.subtotal).toBe(9000);
    expect(totals.discount).toBe(1000);
    expect(totals.total).toBe(8000);
  });

  it("updates and removes cart items", () => {
    let cart = createEmptyCart();
    cart = addToCart(cart, singleProduct, 1);
    cart = updateCartItemQty(cart, singleProduct.id, 5);
    expect(cart.items[0].qty).toBe(5);

    cart = updateCartItemQty(cart, singleProduct.id, 0);
    expect(cart.items).toHaveLength(0);

    cart = addToCart(cart, singleProduct, 2);
    cart = removeCartItem(cart, singleProduct.id);
    expect(cart.items).toHaveLength(0);
  });
});
