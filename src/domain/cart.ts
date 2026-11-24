import type { Product } from "@/data/schemas";

export interface CartItem {
  product: Product;
  qty: number; // unit jual
  unitPrice: number;
  unitCost: number;
  stockProductId: string;
  stockQty: number; // qty * unit_qty
}

export interface CartState {
  items: CartItem[];
  discount: number; // nominal Rupiah
}

export function createEmptyCart(): CartState {
  return { items: [], discount: 0 };
}

export function addToCart(
  cart: CartState,
  product: Product,
  qtyToAdd: number = 1
): CartState {
  const stockProductId =
    product.kind === "bundle" && product.base_product_id
      ? product.base_product_id
      : product.id;

  const existingIndex = cart.items.findIndex(
    (item) => item.product.id === product.id
  );

  let updatedItems: CartItem[];

  if (existingIndex >= 0) {
    const existing = cart.items[existingIndex];
    const newQty = existing.qty + qtyToAdd;
    if (newQty <= 0) {
      updatedItems = cart.items.filter((_, i) => i !== existingIndex);
    } else {
      updatedItems = [...cart.items];
      updatedItems[existingIndex] = {
        ...existing,
        qty: newQty,
        stockQty: newQty * product.unit_qty,
      };
    }
  } else {
    if (qtyToAdd <= 0) return cart;
    const newItem: CartItem = {
      product,
      qty: qtyToAdd,
      unitPrice: product.price,
      unitCost: product.cost_price,
      stockProductId,
      stockQty: qtyToAdd * product.unit_qty,
    };
    updatedItems = [...cart.items, newItem];
  }

  return {
    ...cart,
    items: updatedItems,
  };
}

export function updateCartItemQty(
  cart: CartState,
  productId: string,
  newQty: number
): CartState {
  if (newQty <= 0) {
    return {
      ...cart,
      items: cart.items.filter((item) => item.product.id !== productId),
    };
  }

  const updatedItems = cart.items.map((item) => {
    if (item.product.id === productId) {
      return {
        ...item,
        qty: newQty,
        stockQty: newQty * item.product.unit_qty,
      };
    }
    return item;
  });

  return {
    ...cart,
    items: updatedItems,
  };
}

export function removeCartItem(cart: CartState, productId: string): CartState {
  return {
    ...cart,
    items: cart.items.filter((item) => item.product.id !== productId),
  };
}

export function setDiscount(cart: CartState, discount: number): CartState {
  return {
    ...cart,
    discount: Math.max(0, Math.round(discount)),
  };
}

export function calculateCartTotals(cart: CartState): {
  subtotal: number;
  discount: number;
  total: number;
  totalItems: number;
} {
  const subtotal = cart.items.reduce(
    (acc, item) => acc + item.qty * item.unitPrice,
    0
  );
  const total = Math.max(0, subtotal - cart.discount);
  const totalItems = cart.items.reduce((acc, item) => acc + item.qty, 0);

  return {
    subtotal,
    discount: cart.discount,
    total,
    totalItems,
  };
}
