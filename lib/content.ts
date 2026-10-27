import { promises as fs } from "fs";
import path from "path";

/**
 * Reads every .md file in /content at request time and concatenates them as
 * labeled sections. New files dropped into /content are picked up on the very
 * next request — zero code changes required.
 */
export async function loadContent(): Promise<string> {
  const dir = path.join(process.cwd(), "content");
  const entries = await fs.readdir(dir);
  const mdFiles = entries.filter((f) => f.toLowerCase().endsWith(".md")).sort();

  const sections = await Promise.all(
    mdFiles.map(async (file) => {
      const body = await fs.readFile(path.join(dir, file), "utf8");
      return `=== FILE: ${file} ===\n${body.trim()}`;
    }),
  );

  return sections.join("\n\n");
}
