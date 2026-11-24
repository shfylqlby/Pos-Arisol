"use client";

import React, { useState } from "react";
import { Delete } from "lucide-react";

interface MoneyKeypadProps {
  initial?: number;
  onSubmit: (amount: number) => void;
  onCancel: () => void;
}

export function MoneyKeypad({ initial = 0, onSubmit, onCancel }: MoneyKeypadProps) {
  const [value, setValue] = useState<string>(initial > 0 ? String(initial) : "");

  const display = value ? Number(value) : 0;

  const press = (digit: string) => {
    setValue((prev) => {
      if (prev.length >= 9) return prev;
      if (prev === "0") return digit;
      return prev + digit;
    });
  };

  const backspace = () => setValue((prev) => prev.slice(0, -1));

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-card border border-border bg-surface p-4 text-right">
        <div className="text-xs text-ink-muted">Jumlah</div>
        <div className="tabular-nums text-3xl font-bold text-ink">
          {display.toLocaleString("id-ID")}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            onClick={() => press(d)}
            className="min-h-[56px] rounded-btn border border-border bg-surface text-xl font-bold active:bg-primary-soft"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => press("000")}
          className="min-h-[56px] rounded-btn border border-border bg-surface text-base font-bold active:bg-primary-soft"
        >
          000
        </button>
        <button
          onClick={() => press("0")}
          className="min-h-[56px] rounded-btn border border-border bg-surface text-xl font-bold active:bg-primary-soft"
        >
          0
        </button>
        <button
          onClick={backspace}
          className="flex min-h-[56px] items-center justify-center rounded-btn border border-border bg-surface active:bg-primary-soft"
          aria-label="Hapus"
        >
          <Delete size={22} />
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="min-h-[48px] flex-1 rounded-btn border border-border bg-surface font-semibold text-ink-muted"
        >
          Batal
        </button>
        <button
          onClick={() => onSubmit(display)}
          className="min-h-[48px] flex-[2] rounded-btn bg-primary font-bold text-on-primary active:opacity-90"
        >
          Pakai {display > 0 ? display.toLocaleString("id-ID") : ""}
        </button>
      </div>
    </div>
  );
}
