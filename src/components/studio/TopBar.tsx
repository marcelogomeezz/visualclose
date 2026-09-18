"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { actions, useProject } from "@/state/project-store";
import { ui } from "@/state/ui-store";

export function TopBar() {
  const project = useProject();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [menu]);

  const commit = () => {
    setEditing(false);
    const name = draft.trim();
    if (name && name !== project?.name) actions.renameProject(name);
  };

  const item = (label: string, onClick: () => void) => (
    <button
      type="button"
      className="w-full text-left px-4 py-2.5 text-[11px] tracking-[0.12em] uppercase text-warm-grey hover:text-ivory hover:bg-graphite-3 transition-colors"
      onClick={() => {
        setMenu(false);
        onClick();
      }}
    >
      {label}
    </button>
  );

  return (
    <header className="h-full grid grid-cols-[1fr_auto_1fr] items-center hairline-b bg-graphite-1 px-4">
      <Link href="/" className="text-[11px] tracking-[0.3em] font-medium text-ivory select-none hover:text-offwhite w-max">
        VISUALCLOSE
      </Link>
      <div className="flex justify-center min-w-0">
        {editing ? (
          <input
            autoFocus
            className="bg-transparent text-center text-[12px] text-ivory outline-none border-b border-line-strong w-[260px] py-0.5"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(project?.name ?? "");
              setEditing(true);
            }}
            className="text-[12px] text-ivory/80 hover:text-ivory truncate py-0.5"
            title="Renombrar proyecto"
          >
            {project?.name ?? "—"}
          </button>
        )}
      </div>
      <div className="flex justify-end items-center gap-1 relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => ui.enterPresent()}
          className="h-8 px-3.5 text-[10.5px] tracking-[0.18em] uppercase font-medium text-graphite-0 bg-ivory hover:bg-offwhite transition-colors"
        >
          Presentar
        </button>
        <button
          type="button"
          aria-label="Más"
          onClick={() => setMenu((m) => !m)}
          className="h-8 w-8 flex items-center justify-center text-warm-grey hover:text-ivory text-[16px] leading-none"
        >
          ···
        </button>
        {menu && (
          <div className="absolute right-0 top-10 w-52 bg-graphite-2 border border-line py-1 z-40 vc-fade-in">
            {item("Proyectos", () => ui.openSheet("projects"))}
            {item("Nuevo proyecto", () => {
              actions.newProject("Proyecto sin título");
              ui.setMode("ORIGINAL");
              ui.selectOutput(null);
            })}
            {item("Cargar demo", () => {
              actions.loadDemoProject();
              ui.setMode("ORIGINAL");
              ui.selectOutput(null);
              ui.resetViewport();
              ui.toast("Demo cargada");
            })}
            <div className="hairline-t my-1" />
            {item("Avanzado", () => ui.openSheet("advanced"))}
          </div>
        )}
      </div>
    </header>
  );
}
