"use client";

import React from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:opacity-90 active:opacity-80 disabled:opacity-40",
  secondary:
    "bg-surface text-ink border border-border hover:bg-primary-soft/40 active:bg-primary-soft/60 disabled:opacity-40",
  danger: "bg-danger text-white hover:opacity-90 active:opacity-80 disabled:opacity-40",
  ghost: "bg-transparent text-ink hover:bg-primary-soft/40 active:bg-primary-soft/60",
};

const sizeClasses: Record<Size, string> = {
  md: "min-h-[48px] px-4 text-base",
  lg: "min-h-[56px] px-6 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-btn font-semibold",
        "select-none transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
