"use client";

import React from "react";

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <span className="text-xs text-ink-muted">{hint}</span>}
      {error && <span className="text-xs font-medium text-danger">{error}</span>}
    </div>
  );
}

const inputBase =
  "min-h-[48px] w-full rounded-btn border border-border bg-surface px-3 text-base text-ink placeholder:text-ink-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`${inputBase} ${className}`} {...rest} />;
}

export function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      type="number"
      inputMode="numeric"
      className={`${inputBase} tabular-nums ${className}`}
      {...rest}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      className={`placeholder:text-ink-muted/60 min-h-[80px] w-full rounded-btn border border-border bg-surface p-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
      {...rest}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = props;
  return <select className={`${inputBase} ${className}`} {...rest} />;
}
