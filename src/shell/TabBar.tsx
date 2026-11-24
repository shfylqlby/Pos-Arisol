"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Boxes,
  ClipboardList,
  BarChart3,
  Menu,
} from "lucide-react";

const tabs = [
  { href: "/", label: "Kasir", icon: ShoppingCart },
  { href: "/stok", label: "Stok", icon: Boxes },
  { href: "/pesanan", label: "Pesanan", icon: ClipboardList },
  { href: "/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/lainnya", label: "Lainnya", icon: Menu },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface lg:hidden"
      aria-label="Navigasi utama"
    >
      <div className="mx-auto flex max-w-lg items-stretch">
        {tabs.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2",
                active ? "text-primary" : "text-ink-muted",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
