import { loadDefaultCustomizableSkills } from "@/lib/skill";

export const runtime = "nodejs";

/** Defaults for visitor-editable skills (settings panel + restore). */
export async function GET() {
  const skills = await loadDefaultCustomizableSkills();
  return Response.json({ skills });
}
