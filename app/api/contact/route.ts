import { isEmailConfigured, sendContactEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_VALUE_LENGTH = 4000;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!checkRateLimit(ip)) {
    return Response.json({ delivered: false, reason: "rate-limited" }, { status: 429 });
  }

  if (!isEmailConfigured()) {
    return Response.json({ delivered: false, reason: "not-configured" });
  }

  let formTitle: string;
  let values: Record<string, string>;
  try {
    const body = (await req.json()) as { formTitle?: unknown; values?: unknown };
    formTitle = typeof body.formTitle === "string" ? body.formTitle.slice(0, 200) : "Contact form";
    if (typeof body.values !== "object" || body.values === null) throw new Error("bad values");
    values = {};
    for (const [key, value] of Object.entries(body.values as Record<string, unknown>)) {
      if (typeof value === "string" && value.trim().length > 0) {
        values[key.slice(0, 100)] = value.slice(0, MAX_VALUE_LENGTH);
      }
    }
    if (Object.keys(values).length === 0) throw new Error("empty");
  } catch {
    return Response.json({ delivered: false, reason: "invalid" }, { status: 400 });
  }

  const delivered = await sendContactEmail({ formTitle, values });
  return Response.json({ delivered });
}
