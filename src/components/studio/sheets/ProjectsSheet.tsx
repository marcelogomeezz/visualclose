"use client";

import { DEMO_PROJECT_ID, actions, useProject, useProjectState } from "@/state/project-store";
import { ui } from "@/state/ui-store";
import { Button } from "@/components/ui/Button";
import { formatDate, formatTime } from "@/lib/format";
import { Sheet } from "./Sheet";

export function ProjectsSheet() {
  const projects = useProjectState((s) => s.projects);
  const current = useProject();
  const openAndClose = async (fn: () => void | Promise<void>) => {
    await fn();
    ui.setMode("ORIGINAL");
    ui.selectOutput(null);
    ui.resetViewport();
    ui.closeSheet();
  };
  return (
    <Sheet title="Proyectos">
      <div className="px-5 py-4 flex gap-2 hairline-b">
        <Button variant="primary" onClick={() => void openAndClose(() => actions.newProject("Proyecto sin título"))}>
          Nuevo proyecto
        </Button>
        <Button variant="outline" onClick={() => void openAndClose(() => actions.loadDemoProject())}>
          Cargar demo
        </Button>
      </div>
      <ul>
        {projects.map((p) => {
          const active = p.id === current?.id;
          return (
            <li key={p.id} className={`px-5 py-3 hairline-b flex items-center gap-4 ${active ? "bg-graphite-2" : "hover:bg-graphite-2/60"}`}>
              <button type="button" className="flex-1 text-left min-w-0" onClick={() => void openAndClose(() => actions.openProject(p.id))}>
                <div className="text-[12.5px] text-ivory truncate">{p.name}</div>
                <div className="t-label mt-0.5">
                  {p.productName} · {formatDate(p.updatedAt)} {formatTime(p.updatedAt)}
                  {p.id === DEMO_PROJECT_ID && " · demo"}
                </div>
              </button>
              <button type="button" className="t-label hover:text-danger transition-colors" onClick={() => void actions.deleteProject(p.id)}>
                Eliminar
              </button>
            </li>
          );
        })}
        {projects.length === 0 && <li className="px-5 py-6 text-[11px] text-warm-grey">Todavía no hay proyectos guardados.</li>}
      </ul>
      <div className="px-5 py-4 text-[10.5px] text-warm-grey-2">Los proyectos y las fotos se guardan en este navegador.</div>
    </Sheet>
  );
}
