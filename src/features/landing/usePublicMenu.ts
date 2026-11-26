"use client";

import { useEffect, useState } from "react";
import { fetchPublicMenu, type PublicMenuItem } from "@/data/public-menu";
import { MENU_ITEMS } from "@/features/landing/menu-data";

const FALLBACK: PublicMenuItem[] = MENU_ITEMS.map((item, index) => ({
  ...item,
  image_url: null,
  sort_order: index,
  active: true,
  product_id: null,
  stock_qty: null,
}));

let cached: PublicMenuItem[] | null = null;
let pending: Promise<PublicMenuItem[]> | null = null;
let version = 0;

function loadMenu(): Promise<PublicMenuItem[]> {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    const currentVersion = version;
    pending = fetchPublicMenu()
      .then((rows) => {
        if (rows.length > 0 && currentVersion === version) cached = rows;
        return rows;
      })
      .catch(() => [])
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

export function invalidatePublicMenuCache(): void {
  version += 1;
  cached = null;
  pending = null;
}

export function usePublicMenu(): PublicMenuItem[] {
  const [items, setItems] = useState<PublicMenuItem[]>(cached ?? FALLBACK);

  useEffect(() => {
    let active = true;
    void loadMenu().then((rows) => {
      if (active && rows.length > 0) setItems(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  return items;
}
