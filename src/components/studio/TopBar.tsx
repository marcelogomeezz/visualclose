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
      className="w-full text-left mx-1.5 my-0.5 rounded-lg px-3 py-2 text-[12px] text-ink-2 hover:text-ink hover:bg-stone transition-colors"
      style={{ width: "calc(100% - 12px)" }}
      onClick={() => {
        setMenu(false);
        onClick();
      }}
    >
      {label}
    </button>
  );

  return (
    <header className="h-full grid grid-cols-[1fr_auto_1fr] items-center hairline-b bg-paper px-4">
      <Link href="/" className="text-[11px] tracking-[0.3em] font-medium text-ink select-none hover:text-ink w-max">
        VISUALCLOSE
      </Link>
      <div className="flex justify-center min-w-0">
        {editing ? (
          <input
            autoFocus
            className="bg-transparent text-center text-[12px] text-ink outline-none border-b border-line-strong w-[260px] py-0.5"
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
            className="text-[12px] text-ink/85 hover:text-ink truncate py-0.5"
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
          className="h-9 px-4 rounded-full text-[12px] font-medium text-white bg-ink hover:bg-ink-2 transition-colors"
        >
          Presentar
        </button>
        <button
          type="button"
          aria-label="Más"
          onClick={() => setMenu((m) => !m)}
          className="h-9 w-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-stone text-[16px] leading-none transition-colors"
        >
          ···
        </button>
        {menu && (
          <div className="absolute right-0 top-11 w-52 rounded-2xl bg-white border border-line py-1.5 lift z-40 vc-fade-in">
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
