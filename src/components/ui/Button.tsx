"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "outline" | "quiet" | "danger";
type Size = "sm" | "md" | "lg";

const base = "inline-flex items-center justify-center gap-2 select-none transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink-2",
  outline: "border border-line-strong text-ink hover:bg-stone",
  ghost: "text-ink hover:bg-stone",
  quiet: "text-muted hover:text-ink",
  danger: "text-danger hover:bg-stone",
};
const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[11px] font-medium rounded-md",
  md: "h-9 px-3.5 text-[12px] font-medium rounded-lg",
  lg: "h-11 px-5 text-[13px] font-medium rounded-full",
};

export function Button({
  variant = "outline",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
