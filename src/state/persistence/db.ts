import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Project, ProjectSummary } from "@/core/types";

interface VisualCloseDB extends DBSchema {
  projects: { key: string; value: Project; indexes: { updatedAt: number } };
  assets: { key: string; value: { id: string; blob: Blob; name: string; mime: string } };
  meta: { key: string; value: { key: string; value: string } };
}

let dbPromise: Promise<IDBPDatabase<VisualCloseDB>> | null = null;

function db(): Promise<IDBPDatabase<VisualCloseDB>> {
  if (!dbPromise) {
    dbPromise = openDB<VisualCloseDB>("visualclose", 1, {
      upgrade(database) {
        const projects = database.createObjectStore("projects", { keyPath: "id" });
        projects.createIndex("updatedAt", "updatedAt");
        database.createObjectStore("assets", { keyPath: "id" });
        database.createObjectStore("meta", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}

export const persistence = {
  async saveProject(project: Project): Promise<void> {
    await (await db()).put("projects", project);
  },
  async loadProject(id: string): Promise<Project | undefined> {
    return (await db()).get("projects", id);
  },
  async deleteProject(id: string): Promise<void> {
    await (await db()).delete("projects", id);
  },
  async listProjects(): Promise<ProjectSummary[]> {
    const all = await (await db()).getAll("projects");
    return all
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((p) => ({
        id: p.id,
        name: p.name,
        updatedAt: p.updatedAt,
        productName: p.productPack.name,
        thumbnailUrl: p.space?.asset.kind === "url" ? p.space.asset.url : null,
      }));
  },
  async putAsset(id: string, blob: Blob, name: string, mime: string): Promise<void> {
    await (await db()).put("assets", { id, blob, name, mime });
  },
  async getAsset(id: string): Promise<Blob | undefined> {
    return (await (await db()).get("assets", id))?.blob;
  },
  async deleteAsset(id: string): Promise<void> {
    await (await db()).delete("assets", id);
  },
  async setMeta(key: string, value: string): Promise<void> {
    await (await db()).put("meta", { key, value });
  },
  async getMeta(key: string): Promise<string | undefined> {
    return (await (await db()).get("meta", key))?.value;
  },
  async clearAll(): Promise<void> {
    const d = await db();
    await Promise.all([d.clear("projects"), d.clear("assets"), d.clear("meta")]);
  },
};
