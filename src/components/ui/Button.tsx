"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "outline" | "quiet" | "danger";
type Size = "sm" | "md" | "lg";

const base = "inline-flex items-center justify-center gap-2 select-none transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-ivory text-graphite-0 hover:bg-offwhite",
  outline: "border border-line-strong text-ivory hover:bg-graphite-3",
  ghost: "text-ivory hover:bg-graphite-3",
  quiet: "text-warm-grey hover:text-ivory",
  danger: "text-danger hover:bg-graphite-3",
};
const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[10.5px] tracking-[0.12em] uppercase font-medium",
  md: "h-8 px-3.5 text-[11px] tracking-[0.12em] uppercase font-medium",
  lg: "h-10 px-5 text-[11.5px] tracking-[0.14em] uppercase font-medium",
};

export function Button({
  variant = "outline",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
