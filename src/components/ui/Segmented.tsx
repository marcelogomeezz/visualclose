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
    <div className={`inline-flex border border-line ${className}`} role="tablist">
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
            className={`${size === "sm" ? "h-7 px-2.5 text-[10.5px]" : "h-8 px-3 text-[11px]"} tracking-[0.12em] uppercase font-medium transition-colors duration-150 disabled:opacity-35 ${
              active ? "bg-ivory text-graphite-0" : "text-warm-grey hover:text-ivory"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
