import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type LanguageModel, type UIMessage } from "ai";
import { loadContent } from "@/lib/content";
import {
  loadSystemSkills,
  loadDefaultCustomizableSkills,
  parseClientSkills,
} from "@/lib/skill";
import { buildSystemPrompt } from "@/lib/prompt";
import { checkRateLimit } from "@/lib/rate-limit";
import { isEmailConfigured } from "@/lib/email";
import { layoutHistoryNote } from "@/lib/layout-history";
import { layoutInputFromObjects, scanLayoutObjects } from "@/lib/layout-text";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

/** Visitor-supplied key (from the settings panel) or the site default. */
function resolveModel(req: Request): { model: LanguageModel; isGoogle: boolean } {
  const provider = req.headers.get("x-model-provider");
  const apiKey = req.headers.get("x-model-api-key")?.trim();
  const modelId = req.headers.get("x-model-id")?.trim();

  if (!provider || !apiKey) {
    return { model: google(DEFAULT_MODEL), isGoogle: true };
  }

  switch (provider) {
    case "openai":
      if (!modelId) break;
      return { model: createOpenAI({ apiKey })(modelId), isGoogle: false };
    case "anthropic":
      if (!modelId) break;
      return { model: createAnthropic({ apiKey })(modelId), isGoogle: false };
    case "google":
      return { model: createGoogleGenerativeAI({ apiKey })(modelId || DEFAULT_MODEL), isGoogle: true };
  }
  return { model: google(DEFAULT_MODEL), isGoogle: true };
}

/**
 * Past assistant turns are raw JSONL layout dumps. Sending them back verbatim
 * bloats context and makes the model copy previous pages, so each one is
 * collapsed into a compact "what was on screen" note.
 */
function sanitizeHistory(messages: UIMessage[]): UIMessage[] {
  return messages.map((message) => {
    if (message.role !== "assistant") return message;

    const rawText = message.parts
      .map((part) => (part.type === "text" && typeof part.text === "string" ? part.text : ""))
      .join("\n");

    const parts: UIMessage["parts"] = [];

    if (rawText.trim().length > 0) {
      const input = layoutInputFromObjects(scanLayoutObjects(rawText).objects);
      parts.push({ type: "text", text: layoutHistoryNote(input) });
    }

    // Tool parts only exist in sessions started before the text-stream switch.
    for (const part of message.parts) {
      if (part.type.startsWith("tool-") && "input" in part) {
        parts.push({ type: "text", text: layoutHistoryNote(part.input) });
      }
    }

    return { ...message, parts };
  });
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 },
    );
  }

  // Deployed without a site key, every visitor brings their own. The client
  // shows this text as-is in a toast, so it's plain text rather than JSON.
  const hasVisitorKey = Boolean(req.headers.get("x-model-api-key")?.trim());
  if (!hasVisitorKey && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response(
      "This site runs on your own AI key. Open ⚙ next to the input, paste a Gemini, OpenAI or Anthropic key, and ask again.",
      { status: 401 },
    );
  }

  let messages: UIMessage[];
  let clientSkillsRaw: unknown;
  try {
    const body: unknown = await req.json();
    const candidate = (body as { messages?: unknown }).messages;
    if (!Array.isArray(candidate)) throw new Error("messages must be an array");
    messages = candidate as UIMessage[];
    clientSkillsRaw = (body as { skills?: unknown }).skills;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const [content, systemSkills, defaultCustomizable] = await Promise.all([
    loadContent(),
    loadSystemSkills(),
    loadDefaultCustomizableSkills(),
  ]);

  const customizable = parseClientSkills(clientSkillsRaw) ?? defaultCustomizable;
  const skills = [...systemSkills, ...customizable];
  const system = buildSystemPrompt(content, { skills, emailEnabled: isEmailConfigured() });

  const { model, isGoogle } = resolveModel(req);

  const result = streamText({
    model,
    temperature: 0.95,
    ...(isGoogle
      ? {
          providerOptions: {
            google: { thinkingConfig: { thinkingLevel: "minimal" } },
          },
        }
      : {}),
    system,
    messages: convertToModelMessages(sanitizeHistory(messages)),
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      if (/quota|rate.?limit|resource.?exhausted|429/i.test(message)) {
        return "This site has hit its free AI usage limit for now. Wait a minute and try again, or open Settings and use your own API key.";
      }
      return "The interface engine hit a snag — check your model settings or try again.";
    },
  });
}
