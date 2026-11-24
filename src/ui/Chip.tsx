"use client";

import React from "react";

type ChipTone = "default" | "success" | "warning" | "danger" | "primary";

interface ChipProps {
  children: React.ReactNode;
  tone?: ChipTone;
  onClick?: () => void;
  active?: boolean;
}

const toneMap: Record<ChipTone, string> = {
  default: "bg-surface text-ink-muted border-border",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/30",
  primary: "bg-primary-soft text-primary border-primary/30",
};

export function Chip({ children, tone = "default", onClick, active }: ChipProps) {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold";
  const activeCls = active ? "bg-primary text-on-primary border-primary" : toneMap[tone];

  if (onClick) {
    return (
      <button onClick={onClick} className={`${base} ${activeCls}`}>
        {children}
      </button>
    );
  }
  return <span className={`${base} ${activeCls}`}>{children}</span>;
}
