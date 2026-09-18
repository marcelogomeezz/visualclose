"use client";

import { useState } from "react";
import { actions, useProject } from "@/state/project-store";
import { ui, useUI } from "@/state/ui-store";

export function TopBar() {
  const project = useProject();
  const sheet = useUI((s) => s.sheet);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    setEditing(false);
    const name = draft.trim();
    if (name && name !== project?.name) actions.renameProject(name);
    else setDraft(project?.name ?? "");
  };

  const navBtn = (label: string, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={`h-full px-3 text-[10.5px] tracking-[0.16em] uppercase font-medium transition-colors ${active ? "text-ivory" : "text-warm-grey hover:text-ivory"}`}
    >
      {label}
    </button>
  );

  return (
    <header className="h-full grid grid-cols-[264px_1fr_304px] items-center hairline-b bg-graphite-1">
      <div className="pl-4 text-[11px] tracking-[0.3em] font-medium text-ivory select-none">VISUALCLOSE</div>
      <div className="flex justify-center">
        {editing ? (
          <input
            autoFocus
            className="bg-transparent text-center text-[12px] text-ivory outline-none border-b border-line-strong w-[320px] py-0.5"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(project?.name ?? "");
                setEditing(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(project?.name ?? "");
              setEditing(true);
            }} className="text-[12px] text-ivory/90 hover:text-ivory tracking-[0.02em] py-0.5" title="Rename project">
            {project?.name ?? "—"}
          </button>
        )}
      </div>
      <nav className="h-full flex justify-end pr-2">
        {navBtn("Projects", sheet === "projects", () => ui.openSheet("projects"))}
        {navBtn("Present", false, () => ui.enterPresent())}
        {navBtn("Dev", sheet === "dev", () => ui.openSheet("dev"))}
      </nav>
    </header>
  );
}
