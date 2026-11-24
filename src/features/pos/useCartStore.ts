"use client";

import { create } from "zustand";
import type { Product } from "@/data/schemas";
import {
  addToCart,
  createEmptyCart,
  removeCartItem,
  setDiscount as applyDiscount,
  updateCartItemQty,
  type CartState,
} from "@/domain/cart";

interface CartStore extends CartState {
  add: (product: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  setDiscount: (discount: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  ...createEmptyCart(),
  add: (product, qty = 1) => {
    const next = addToCart(get(), product, qty);
    set({ items: next.items, discount: next.discount });
  },
  setQty: (productId, qty) => {
    const next = updateCartItemQty(get(), productId, qty);
    set({ items: next.items, discount: next.discount });
  },
  remove: (productId) => {
    const next = removeCartItem(get(), productId);
    set({ items: next.items, discount: next.discount });
  },
  setDiscount: (discount) => {
    const next = applyDiscount(get(), discount);
    set({ items: next.items, discount: next.discount });
  },
  clear: () => set({ items: [], discount: 0 }),
}));
