import { promises as fs } from "fs";
import path from "path";
import type { Skill } from "@/lib/skill-types";

export type { Skill };

/**
 * Skills are markdown briefs injected into the system prompt — not Cursor-style
 * on-disk agents. Two buckets:
 *
 * - system/         always sent, invisible to visitors
 * - customizable/   defaults shipped to the client; visitors may override in
 *                   localStorage via the settings panel
 */

const MAX_SKILLS = 20;
const MAX_BODY_CHARS = 40_000;
const MAX_NAME_CHARS = 120;
const MAX_ID_CHARS = 64;

function skillsRoot(...parts: string[]): string {
  return path.join(process.cwd(), "skills", ...parts);
}

function titleFromBody(body: string, fallback: string): string {
  const heading = body.match(/^#\s+(.+)$/m);
  if (heading?.[1]) return heading[1].trim();
  return fallback
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function loadSkillsFromDir(dir: string): Promise<Skill[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const skills: Skill[] = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const id = entry.name.replace(/\.md$/i, "");
      if (!id) continue;
      const body = (await fs.readFile(path.join(dir, entry.name), "utf8")).trim();
      if (!body) continue;
      skills.push({ id, name: titleFromBody(body, id), body });
    }

    return skills.sort((a, b) => a.id.localeCompare(b.id));
  } catch {
    return [];
  }
}

/** Always-on skills. Never exposed to the client. */
export async function loadSystemSkills(): Promise<Skill[]> {
  return loadSkillsFromDir(skillsRoot("system"));
}

/** Default customizable skills (editable by visitors after copy to localStorage). */
export async function loadDefaultCustomizableSkills(): Promise<Skill[]> {
  return loadSkillsFromDir(skillsRoot("customizable"));
}

/**
 * Validates visitor-supplied customizable skills from the chat request body.
 * Returns null when the payload is missing/invalid so the route can fall back
 * to on-disk defaults.
 */
export function parseClientSkills(raw: unknown): Skill[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length > MAX_SKILLS) return null;

  const skills: Skill[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const rec = item as Record<string, unknown>;
    if (typeof rec.id !== "string" || typeof rec.name !== "string" || typeof rec.body !== "string") {
      return null;
    }

    const id = rec.id.trim().slice(0, MAX_ID_CHARS);
    const name = rec.name.trim().slice(0, MAX_NAME_CHARS);
    const body = rec.body.trim().slice(0, MAX_BODY_CHARS);

    if (!id || !name || !body) continue;
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id)) return null;
    if (seen.has(id.toLowerCase())) return null;
    seen.add(id.toLowerCase());

    skills.push({ id, name, body });
  }

  return skills;
}

/** Formats skills for injection into the system prompt. */
export function formatSkillsForPrompt(skills: Skill[]): string {
  if (skills.length === 0) return "";
  return skills
    .map((skill) => `## Skill: ${skill.name}\n${skill.body}`)
    .join("\n\n");
}
