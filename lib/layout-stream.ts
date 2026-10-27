import type { UIMessage } from "ai";
import { guardLayoutAgainstLeak } from "@/lib/content-leak";
import { parseLayoutText } from "@/lib/layout-text";
import { salvageLayoutFromText, type Layout } from "@/lib/tools";

type PartLike = {
  type: string;
  state?: string;
  input?: unknown;
  text?: string;
};

export type ActiveStream = {
  /** Changes whenever another object finishes — lets the client apply new nodes immediately. */
  key: string;
  layout: Layout;
};

function latestAssistant(messages: UIMessage[]): UIMessage | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") return messages[i];
  }
  return null;
}

export function textFromAssistant(message: UIMessage): string {
  const parts = message.parts as unknown as PartLike[];
  return parts
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("\n")
    .trim();
}

/** Partial layout from the still-streaming assistant reply (JSONL text). */
export function findStreamingLayout(messages: UIMessage[]): ActiveStream | null {
  const message = latestAssistant(messages);
  if (!message) return null;

  const text = textFromAssistant(message);
  if (!text) return null;

  const { layout, completeCount } = parseLayoutText(text, { includePartial: true });
  if (layout.nodes.length === 0 && !layout.theme) return null;

  const safe = guardLayoutAgainstLeak(text, layout);
  return {
    key: `${message.id}:${completeCount}:${safe.nodes.length}`,
    layout: safe,
  };
}

/** Final layout from the latest assistant turn, with a prose salvage fallback. */
export function extractCompletedLayout(messages: UIMessage[]): { key: string; layout: Layout } | null {
  const message = latestAssistant(messages);
  if (!message) return null;

  const text = textFromAssistant(message);
  if (!text) return null;

  const { layout } = parseLayoutText(text);
  if (layout.nodes.length > 0) {
    return { key: `${message.id}:final`, layout: guardLayoutAgainstLeak(text, layout) };
  }

  const salvaged = salvageLayoutFromText(text);
  if (salvaged && salvaged.nodes.length > 0) {
    return {
      key: `${message.id}:salvage`,
      layout: guardLayoutAgainstLeak(text, salvaged),
    };
  }

  return null;
}
