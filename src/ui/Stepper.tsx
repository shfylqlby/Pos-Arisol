"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function Stepper({ value, onChange, min = 1, max = 999 }: StepperProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-btn border border-border bg-surface">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="hover:bg-primary-soft/50 flex h-12 w-12 items-center justify-center rounded-l-btn text-ink active:bg-primary-soft"
        aria-label="Kurangi"
      >
        <Minus size={20} />
      </button>
      <span className="min-w-8 text-center text-base font-bold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="hover:bg-primary-soft/50 flex h-12 w-12 items-center justify-center rounded-r-btn text-ink active:bg-primary-soft"
        aria-label="Tambah"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}
