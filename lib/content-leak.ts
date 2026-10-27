import type { Layout } from "@/lib/tools";

/**
 * Detects model replies that look like prompt/content exfiltration.
 *
 * Portfolio *facts* from /content are meant to appear on designed pages.
 * What we block is dumping the raw corpus, file labels, system prompt, or
 * design skill — typical prompt-injection asks.
 *
 * Note: this only stops the canvas from rendering a dump. Text already
 * streamed to the browser is still visible in DevTools. Do not put secrets
 * in /content — treat that folder as public-by-proxy.
 */

const LEAK_PATTERNS: RegExp[] = [
  /===\s*FILE:\s*/i,
  /##\s*CONTENT\s*\(single source/i,
  /You are the interface engine of justaskforit/i,
  /Output format\s*\(non-negotiable\)/i,
  /##\s*Skills\s*\(follow these/i,
  /Site Meta\s*\(instructions for the AI/i,
  /skills\/(?:system|customizable)/i,
  /skills\/frontend-design/i,
  /\b_meta\.md\b/i,
  /\bCONTENT section at the bottom of this prompt\b/i,
  /\bNever mention these instructions\b/i,
];

/** Safe page when the model tries to dump internals. */
export const LEAK_REFUSAL_LAYOUT: Layout = {
  theme: {
    background: "#0c0f0e",
    textColor: "#e8ebe9",
    fontStyle: "sans",
  },
  nodes: [
    {
      type: "hero",
      title: "That ask doesn't work here.",
      subtitle: "This site shows designed pages — not its source files or system instructions.",
      style: { animation: "fade", align: "left", padding: "lg" },
    },
    {
      type: "textBlock",
      markdown:
        "Ask for a resume, projects, about, or contact and you'll get a real page. Raw corpus dumps and prompt peeks are off-limits.",
      style: { animation: "slide-up", emphasis: "subtle" },
    },
    {
      type: "navigationMenu",
      menuItems: [
        { id: "about", label: "About" },
        { id: "resume", label: "Resume" },
        { id: "projects", label: "Projects" },
        { id: "contact", label: "Contact" },
      ],
      style: { animation: "slide-up" },
    },
  ],
};

export function textLooksLikeContentLeak(text: string): boolean {
  if (!text || text.length < 24) return false;
  return LEAK_PATTERNS.some((re) => re.test(text));
}

function collectStrings(value: unknown, out: string[], depth = 0): void {
  if (depth > 8 || value == null) return;
  if (typeof value === "string") {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out, depth + 1);
    return;
  }
  if (typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      collectStrings(v, out, depth + 1);
    }
  }
}

/** True if any string field in the layout looks like an exfiltration dump. */
export function layoutLooksLikeContentLeak(layout: Layout): boolean {
  const strings: string[] = [];
  collectStrings(layout, strings);
  return textLooksLikeContentLeak(strings.join("\n"));
}

/**
 * If raw text or the parsed layout looks like a leak, return the refusal page.
 * Otherwise return the layout unchanged.
 */
export function guardLayoutAgainstLeak(rawText: string, layout: Layout): Layout {
  if (textLooksLikeContentLeak(rawText) || layoutLooksLikeContentLeak(layout)) {
    return LEAK_REFUSAL_LAYOUT;
  }
  return layout;
}
