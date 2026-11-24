"use client";

import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getSettings } from "@/data/repositories/settings";
import { SyncBadge } from "@/ui/SyncBadge";

export function Header() {
  const settings = useLiveQuery(() => getSettings(), [], undefined);

  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg/95 px-4 backdrop-blur">
      <div className="min-w-0">
        <div className="truncate text-sm font-extrabold text-ink">
          {settings?.business_name || "POS Risol"}
        </div>
        <div className="truncate text-[11px] text-ink-muted">{today}</div>
      </div>
      <SyncBadge />
    </header>
  );
}
