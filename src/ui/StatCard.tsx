"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}

const toneMap = {
  default: "text-ink",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

export function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-3">
      <div className="text-xs font-medium text-ink-muted">{label}</div>
      <div className={`mt-1 text-xl font-bold tabular-nums ${toneMap[tone]}`}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}
