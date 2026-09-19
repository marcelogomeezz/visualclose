"use client";

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = "sm",
  className = "",
}: {
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange: (v: T) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div className={`inline-flex rounded-lg border border-line overflow-hidden ${className}`} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`${size === "sm" ? "h-7 px-2.5 text-[10.5px]" : "h-8 px-3 text-[11px]"} tracking-[0.06em] font-medium transition-colors duration-150 disabled:opacity-35 ${
              active ? "bg-ink text-white" : "text-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
