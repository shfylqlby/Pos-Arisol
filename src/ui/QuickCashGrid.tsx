"use client";

import React from "react";
import { formatRupiah } from "@/domain/money";
import { getQuickCashOptions } from "@/domain/money";

interface QuickCashGridProps {
  totalDue: number;
  onSelect: (amount: number) => void;
  onManual: () => void;
}

export function QuickCashGrid({ totalDue, onSelect, onManual }: QuickCashGridProps) {
  const options = getQuickCashOptions(totalDue);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => onSelect(totalDue)}
        className="min-h-[52px] w-full rounded-btn bg-primary-soft text-base font-bold text-primary active:opacity-80"
      >
        UANG PAS
      </button>
      <div className="grid grid-cols-3 gap-2">
        {options.map((amount) => (
          <button
            key={amount}
            onClick={() => onSelect(amount)}
            className="active:bg-primary-soft/60 min-h-[48px] rounded-btn border border-border bg-surface text-sm font-bold tabular-nums text-ink"
          >
            {formatRupiah(amount)}
          </button>
        ))}
        <button
          onClick={onManual}
          className="active:bg-primary-soft/60 min-h-[48px] rounded-btn border border-border bg-surface text-sm font-semibold text-ink-muted"
        >
          Lainnya…
        </button>
      </div>
    </div>
  );
}
