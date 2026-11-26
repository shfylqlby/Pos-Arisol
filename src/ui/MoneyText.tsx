"use client";

import React from "react";
import { formatRupiah } from "@/domain/money";

interface MoneyTextProps {
  amount: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const sizeMap = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
  "2xl": "text-4xl",
};

export function MoneyText({ amount, className = "", size = "md" }: MoneyTextProps) {
  return (
    <span
      className={`font-bold tabular-nums ${sizeMap[size]} ${className}`}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {formatRupiah(amount)}
    </span>
  );
}
