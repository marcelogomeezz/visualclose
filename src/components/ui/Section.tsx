import type { ReactNode } from "react";

export function Section({ title, aside, children, className = "" }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`px-4 py-4 hairline-b ${className}`}>
      <header className="flex items-center justify-between mb-3">
        <span className="t-label">{title}</span>
        {aside}
      </header>
      {children}
    </section>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[12px] text-warm-grey">{label}</span>
      <div className="text-[12px] text-ivory text-right">{children}</div>
    </div>
  );
}
