/**
 * Visitor-editable skills. Defaults come from /api/skills; overrides live in
 * localStorage only and are sent with each /api/chat request.
 */

import type { Skill } from "@/lib/skill-types";

const STORAGE_KEY = "jafi-customizable-skills";

export type { Skill };

export function loadStoredSkills(): Skill[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    const skills: Skill[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      if (
        typeof rec.id === "string" &&
        typeof rec.name === "string" &&
        typeof rec.body === "string" &&
        rec.id.trim() &&
        rec.name.trim() &&
        rec.body.trim()
      ) {
        skills.push({
          id: rec.id.trim(),
          name: rec.name.trim(),
          body: rec.body.trim(),
        });
      }
    }
    return skills;
  } catch {
    return null;
  }
}

export function saveStoredSkills(skills: Skill[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
}

export function clearStoredSkills(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

/** True when localStorage holds an override (even if it matches defaults). */
export function hasStoredSkills(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) != null;
}

export function slugifySkillId(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || `skill-${Date.now().toString(36)}`;
}

export function uniqueSkillId(desired: string, existing: Skill[], exceptId?: string): string {
  const taken = new Set(
    existing.filter((s) => s.id !== exceptId).map((s) => s.id.toLowerCase()),
  );
  let id = desired || "skill";
  if (!taken.has(id.toLowerCase())) return id;
  let n = 2;
  while (taken.has(`${id}-${n}`.toLowerCase())) n += 1;
  return `${id}-${n}`;
}

export async function fetchDefaultSkills(): Promise<Skill[]> {
  const res = await fetch("/api/skills");
  if (!res.ok) return [];
  const data = (await res.json()) as { skills?: unknown };
  if (!Array.isArray(data.skills)) return [];
  return data.skills.filter(
    (s): s is Skill =>
      !!s &&
      typeof s === "object" &&
      typeof (s as Skill).id === "string" &&
      typeof (s as Skill).name === "string" &&
      typeof (s as Skill).body === "string",
  );
}
