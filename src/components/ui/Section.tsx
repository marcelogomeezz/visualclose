import type { ReactNode } from "react";

export function Section({ title, aside, children, className = "" }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`mx-5 my-3 card rounded-2xl p-4 ${className}`}>
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
      <span className="text-[12px] text-muted">{label}</span>
      <div className="text-[12px] text-ink text-right">{children}</div>
    </div>
  );
}
