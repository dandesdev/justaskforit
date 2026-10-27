import { parseLayout, type Layout } from "./tools";

/**
 * Streaming JSONL layout parser.
 *
 * The model streams the page as text: one JSON object per line — a
 * `{"theme": ...}` object first, then one component node per line. Text
 * streams token-by-token (unlike Gemini tool-call arguments, which arrive in
 * a single terminal chunk), so we can hydrate each component the moment its
 * object closes, and even render the trailing half-written object while the
 * model is still typing it.
 *
 * The scanner is deliberately forgiving about shape: it also swallows a
 * wrapping array (`[{...},{...}]`) or a single `{"nodes":[...]}` dump, since
 * models occasionally ignore formatting instructions.
 */

type ScanResult = {
  /** Fully closed top-level objects, in document order. */
  objects: unknown[];
  /** Best-effort repaired parse of the unterminated trailing object. */
  partialTail: unknown | null;
};

function stripFences(raw: string): string {
  let text = raw;
  const fenceStart = text.match(/```(?:json)?\s*/i);
  if (fenceStart && fenceStart.index !== undefined) {
    text = text.slice(fenceStart.index + fenceStart[0].length);
    const fenceEnd = text.lastIndexOf("```");
    if (fenceEnd !== -1) text = text.slice(0, fenceEnd);
  }
  return text;
}

/**
 * Attempt to complete an unterminated JSON fragment by closing the open
 * string (if any) and every open brace/bracket. Fragments that end mid-key or
 * mid-punctuation won't survive JSON.parse and yield null — the caller simply
 * waits for more text.
 */
function repairFragment(fragment: string, stack: string[], inString: boolean, escape: boolean): unknown | null {
  let source = fragment;
  if (escape) source = source.slice(0, -1);
  if (inString) source += '"';
  else source = source.replace(/[\s,:]+$/, "");
  for (let i = stack.length - 1; i >= 0; i--) {
    source += stack[i] === "{" ? "}" : "]";
  }
  try {
    return JSON.parse(source);
  } catch {
    return null;
  }
}

export function scanLayoutObjects(raw: string): ScanResult {
  const text = stripFences(raw);
  const objects: unknown[] = [];

  const stack: string[] = [];
  let inString = false;
  let escape = false;
  let objectStart = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{" || ch === "[") {
      // An object is "top-level" when no brace is open yet (a wrapping array
      // on the stack is fine — we extract its elements individually).
      if (ch === "{" && objectStart === -1) objectStart = i;
      if (objectStart !== -1) stack.push(ch);
      continue;
    }

    if (ch === "}" || ch === "]") {
      if (objectStart === -1) continue;
      const expected = ch === "}" ? "{" : "[";
      if (stack[stack.length - 1] === expected) stack.pop();
      if (stack.length === 0 && ch === "}") {
        try {
          objects.push(JSON.parse(text.slice(objectStart, i + 1)));
        } catch {
          // Malformed object — skip it and keep scanning.
        }
        objectStart = -1;
      }
    }
  }

  let partialTail: unknown | null = null;
  if (objectStart !== -1 && stack.length > 0) {
    partialTail = repairFragment(text.slice(objectStart), stack, inString, escape);
  }

  return { objects, partialTail };
}

export type LayoutInput = { theme?: unknown; nodes: unknown[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Fold scanned objects into a single renderLayout-shaped input. */
export function layoutInputFromObjects(objects: unknown[]): LayoutInput {
  const input: LayoutInput = { nodes: [] };

  for (const obj of objects) {
    if (!isRecord(obj)) continue;

    if (Array.isArray(obj.nodes)) {
      // Whole-layout dump: {"theme": ..., "nodes": [...]}
      if (obj.theme !== undefined) input.theme = obj.theme;
      input.nodes.push(...obj.nodes);
      continue;
    }

    if (typeof obj.type === "string") {
      input.nodes.push(obj);
      continue;
    }

    if (obj.theme !== undefined) {
      input.theme = obj.theme;
      continue;
    }

    // A bare theme object ({"background": ..., "textColor": ...}) with no type.
    if (input.nodes.length === 0 && ("background" in obj || "textColor" in obj || "fontStyle" in obj)) {
      input.theme = obj;
    }
  }

  return input;
}

export type ParsedLayoutText = {
  layout: Layout;
  /** Number of fully closed objects — used as a stream progress key. */
  completeCount: number;
};

export function parseLayoutText(raw: string, options?: { includePartial?: boolean }): ParsedLayoutText {
  const { objects, partialTail } = scanLayoutObjects(raw);
  const all = options?.includePartial && partialTail !== null ? [...objects, partialTail] : objects;
  const input = layoutInputFromObjects(all);
  const layout = parseLayout(input, { allowEmpty: true });
  return { layout, completeCount: objects.length };
}
