"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Boxes, ClipboardList, BarChart3, Menu } from "lucide-react";
import { Logo } from "@/ui/Logo";

const tabs = [
  { href: "/kasir", label: "Kasir", icon: ShoppingCart },
  { href: "/stok", label: "Stok", icon: Boxes },
  { href: "/pesanan", label: "Pesanan", icon: ClipboardList },
  { href: "/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/lainnya", label: "Lainnya", icon: Menu },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden w-56 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col"
      aria-label="Navigasi samping"
    >
      <div className="flex h-16 items-center gap-2 px-4 text-lg font-extrabold text-primary">
        <Logo size={32} priority />
        POS Risol
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                "flex min-h-[48px] items-center gap-3 rounded-btn px-3 text-sm font-semibold transition-colors",
                active
                  ? "bg-primary-soft text-primary"
                  : "hover:bg-primary-soft/40 text-ink-muted hover:text-ink",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={20} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
