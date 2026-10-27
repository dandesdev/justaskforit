import { z } from "zod";

/* ------------------------------------------------------------------ */
/* CSS value safety                                                     */
/* ------------------------------------------------------------------ */

/**
 * Free styling must never become an injection vector. We accept only
 * characters that appear in legitimate CSS colors/gradients and reject
 * anything that could smuggle in a URL, expression, or extra declarations.
 * (No colons, semicolons, quotes, angle brackets, or backslashes pass.)
 */
const SAFE_CSS_PATTERN = /^[a-zA-Z0-9#%(),./\s+-]*$/;
const FORBIDDEN_CSS_SUBSTRINGS = ["url(", "expression", "javascript", "element(", "image-set(", "import"];

export function isSafeCssValue(value: string): boolean {
  if (value.trim().length === 0 || value.length > 400) return false;
  if (!SAFE_CSS_PATTERN.test(value)) return false;
  const lower = value.toLowerCase();
  return !FORBIDDEN_CSS_SUBSTRINGS.some((needle) => lower.includes(needle));
}

const safeCssValue = z.string().refine(isSafeCssValue, { message: "Unsafe CSS value" });

const safeUrl = z.string().refine((u) => /^(https?:\/\/|mailto:)/i.test(u), {
  message: "Only http(s) and mailto URLs are allowed",
});

/* ------------------------------------------------------------------ */
/* Shared style schema (strict — used for validation before render)    */
/* ------------------------------------------------------------------ */

export const styleSchema = z.object({
  background: safeCssValue.optional(),
  textColor: safeCssValue.optional(),
  accentColor: safeCssValue.optional(),
  borderRadius: z.enum(["none", "sm", "md", "lg", "full"]).optional(),
  padding: z.enum(["sm", "md", "lg"]).optional(),
  shadow: z.enum(["none", "sm", "md", "lg"]).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  columns: z.number().int().min(1).max(4).optional(),
  animation: z.enum(["none", "fade", "slide-up"]).optional(),
  fontStyle: z.enum(["sans", "serif", "mono"]).optional(),
  emphasis: z.enum(["subtle", "normal", "bold"]).optional(),
});
export type StyleProps = z.infer<typeof styleSchema>;

export const themeSchema = z.object({
  background: safeCssValue.optional(),
  textColor: safeCssValue.optional(),
  fontStyle: z.enum(["sans", "serif", "mono"]).optional(),
});
export type ThemeProps = z.infer<typeof themeSchema>;

/* ------------------------------------------------------------------ */
/* Sub-object schemas (shared by strict + tool schemas)                 */
/* ------------------------------------------------------------------ */

const cardSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  actionLabel: z.string().optional(),
  actionId: z.string().optional(),
});

const timelineItemSchema = z.object({
  period: z.string(),
  title: z.string(),
  description: z.string(),
});

const skillGroupSchema = z.object({
  label: z.string(),
  skills: z.array(z.string()).min(1),
});

const formFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(["text", "email", "textarea"]),
});

const menuItemSchema = z.object({ id: z.string(), label: z.string() });

const imageSchema = z.object({ imageQuery: z.string(), caption: z.string().optional() });

/* ------------------------------------------------------------------ */
/* Strict component nodes — discriminated union on `type`.              */
/* Every model-produced node is validated against these before render.  */
/* ------------------------------------------------------------------ */

const heroNode = z.object({
  type: z.literal("hero"),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  style: styleSchema.optional(),
});

const cardGridNode = z.object({
  type: z.literal("cardGrid"),
  cards: z.array(cardSchema).min(1),
  style: styleSchema.optional(),
});

const articleNode = z.object({
  type: z.literal("article"),
  title: z.string().min(1),
  markdownBody: z.string().min(1),
  style: styleSchema.optional(),
});

const timelineNode = z.object({
  type: z.literal("timeline"),
  timelineItems: z.array(timelineItemSchema).min(1),
  style: styleSchema.optional(),
});

const skillListNode = z.object({
  type: z.literal("skillList"),
  groups: z.array(skillGroupSchema).min(1),
  style: styleSchema.optional(),
});

const formNode = z.object({
  type: z.literal("form"),
  id: z.string().min(1),
  title: z.string().min(1),
  fields: z.array(formFieldSchema).min(1),
  submitLabel: z.string().default("Send"),
  style: styleSchema.optional(),
});

const navigationMenuNode = z.object({
  type: z.literal("navigationMenu"),
  menuItems: z.array(menuItemSchema).min(1),
  style: styleSchema.optional(),
});

const galleryNode = z.object({
  type: z.literal("gallery"),
  images: z.array(imageSchema).min(1),
  style: styleSchema.optional(),
});

const buttonNode = z.object({
  type: z.literal("button"),
  id: z.string().min(1),
  label: z.string().min(1),
  variant: z.enum(["primary", "secondary"]).default("primary"),
  style: styleSchema.optional(),
});

const textBlockNode = z.object({
  type: z.literal("textBlock"),
  markdown: z.string().min(1),
  style: styleSchema.optional(),
});

const linkListNode = z.object({
  type: z.literal("linkList"),
  links: z.array(z.object({ label: z.string(), url: safeUrl })).min(1),
  style: styleSchema.optional(),
});

const canvasNode = z.object({
  type: z.literal("canvas"),
  /** Full p5.js sketch source (global mode: setup/draw/mouseMoved/etc.). */
  sketch: z.string().min(1).max(20_000),
  title: z.string().optional(),
  /** Pixel height of the sketch surface (width fills the container). */
  height: z.number().int().min(120).max(900).optional(),
  style: styleSchema.optional(),
});

export const componentNodeSchema = z.discriminatedUnion("type", [
  heroNode,
  cardGridNode,
  articleNode,
  timelineNode,
  skillListNode,
  formNode,
  navigationMenuNode,
  galleryNode,
  buttonNode,
  textBlockNode,
  linkListNode,
  canvasNode,
]);

export type ComponentNode = z.infer<typeof componentNodeSchema>;
export type HeroNode = z.infer<typeof heroNode>;
export type CardGridNode = z.infer<typeof cardGridNode>;
export type ArticleNode = z.infer<typeof articleNode>;
export type TimelineNode = z.infer<typeof timelineNode>;
export type SkillListNode = z.infer<typeof skillListNode>;
export type FormNode = z.infer<typeof formNode>;
export type NavigationMenuNode = z.infer<typeof navigationMenuNode>;
export type GalleryNode = z.infer<typeof galleryNode>;
export type ButtonNode = z.infer<typeof buttonNode>;
export type TextBlockNode = z.infer<typeof textBlockNode>;
export type LinkListNode = z.infer<typeof linkListNode>;
export type CanvasNode = z.infer<typeof canvasNode>;

export const layoutSchema = z.object({
  theme: themeSchema.optional(),
  nodes: z.array(componentNodeSchema).min(1),
});
export type Layout = z.infer<typeof layoutSchema>;

/* ------------------------------------------------------------------ */
/* Tool input schema sent to Gemini.                                    */
/*                                                                      */
/* Gemini's function-calling API rejects recursive schemas, `anyOf`     */
/* unions, and `const` literals, so the schema the MODEL sees is a      */
/* single flat node shape with a `type` enum and per-type optional      */
/* fields. The strict discriminated union above is what actually gates  */
/* rendering — anything malformed falls back gracefully.                */
/* ------------------------------------------------------------------ */

const toolStyleSchema = z.object({
  background: z.string().optional().describe("CSS color or gradient, e.g. '#0f172a' or 'linear-gradient(135deg, #f97316, #db2777)'"),
  textColor: z.string().optional().describe("CSS color for text"),
  accentColor: z.string().optional().describe("CSS color used for buttons, links, highlights inside this component"),
  borderRadius: z.enum(["none", "sm", "md", "lg", "full"]).optional(),
  padding: z.enum(["sm", "md", "lg"]).optional(),
  shadow: z.enum(["none", "sm", "md", "lg"]).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  columns: z.number().int().min(1).max(4).optional().describe("Column count for cardGrid/gallery"),
  animation: z.enum(["none", "fade", "slide-up"]).optional(),
  fontStyle: z.enum(["sans", "serif", "mono"]).optional(),
  emphasis: z.enum(["subtle", "normal", "bold"]).optional(),
});

export const renderLayoutInputSchema = z.object({
  theme: z
    .object({
      background: z.string().optional().describe("Page background: CSS color or gradient"),
      textColor: z.string().optional().describe("Default page text color"),
      fontStyle: z.enum(["sans", "serif", "mono"]).optional(),
    })
    .optional()
    .describe("Page-level canvas theme. Set it on every call to control the mood."),
  nodes: z
    .array(
      z.object({
        type: z
          .enum([
            "hero",
            "cardGrid",
            "article",
            "timeline",
            "skillList",
            "form",
            "navigationMenu",
            "gallery",
            "button",
            "textBlock",
            "linkList",
            "canvas",
          ])
          .describe("Which component this node renders"),
        style: toolStyleSchema.optional(),
        title: z.string().optional().describe("hero, article, form, canvas: heading text"),
        subtitle: z.string().optional().describe("hero: supporting line under the title"),
        markdownBody: z.string().optional().describe("article: markdown body (no raw HTML)"),
        markdown: z.string().optional().describe("textBlock: markdown content (no raw HTML)"),
        cards: z.array(cardSchema).optional().describe("cardGrid: cards; give actionId+actionLabel to make a card clickable"),
        timelineItems: z.array(timelineItemSchema).optional().describe("timeline: chronological entries"),
        groups: z.array(skillGroupSchema).optional().describe("skillList: labeled groups of skill strings"),
        id: z.string().optional().describe("form, button: unique id reported back in [UI_EVENT] messages"),
        fields: z.array(formFieldSchema).optional().describe("form: input fields"),
        submitLabel: z.string().optional().describe("form: submit button label"),
        menuItems: z.array(menuItemSchema).optional().describe("navigationMenu: clickable items (id + label)"),
        images: z.array(imageSchema).optional().describe("gallery: imageQuery seeds a placeholder photo; caption optional"),
        label: z.string().optional().describe("button: visible label"),
        variant: z.enum(["primary", "secondary"]).optional().describe("button: visual weight"),
        links: z
          .array(z.object({ label: z.string(), url: z.string() }))
          .optional()
          .describe("linkList: external links (https/mailto only)"),
        sketch: z
          .string()
          .optional()
          .describe(
            "canvas: full p5.js sketch source in global mode (setup/draw/mouseMoved/etc.). Use \\n for newlines. First line of setup MUST be createCanvas(window.innerWidth, SKETCH_HEIGHT).",
          ),
        height: z
          .number()
          .int()
          .min(120)
          .max(900)
          .optional()
          .describe("canvas: pixel height of the sketch (default 400); width fills the container"),
      }),
    )
    .min(1)
    .describe("Complete component tree, rendered top-to-bottom. Replaces the whole canvas."),
});

export type RenderLayoutInput = z.infer<typeof renderLayoutInputSchema>;

/** Fast first paint: theme + hero (+ optional nav). Step 1 of a two-step turn. */
export const renderShellInputSchema = z.object({
  theme: z
    .object({
      background: z.string().optional().describe("Page background: CSS color or gradient"),
      textColor: z.string().optional().describe("Default page text color"),
      fontStyle: z.enum(["sans", "serif", "mono"]).optional(),
    })
    .optional()
    .describe("Page theme — set immediately for mood."),
  hero: z.object({
    title: z.string().describe("Hero headline"),
    subtitle: z.string().optional().describe("Supporting line"),
    style: toolStyleSchema.optional(),
  }),
  navigationMenu: z
    .object({
      menuItems: z.array(menuItemSchema).min(1),
      style: toolStyleSchema.optional(),
    })
    .optional()
    .describe("Optional nav pills while the full page loads"),
});

export type RenderShellInput = z.infer<typeof renderShellInputSchema>;

/* ------------------------------------------------------------------ */
/* Salvaging parser: raw model output -> safe Layout.                   */
/* Never throws. Invalid style values are dropped per-field, invalid    */
/* nodes are skipped, and a fully broken payload becomes a fallback     */
/* TextBlock instead of a crash.                                        */
/* ------------------------------------------------------------------ */

const FALLBACK_NODE: ComponentNode = {
  type: "textBlock",
  markdown: "_Hmm — that layout didn't come through cleanly. Try asking again, or ask for something else._",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validates each style field independently; invalid values are rejected (dropped). */
function sanitizeStyle(raw: unknown): StyleProps | undefined {
  if (!isRecord(raw)) return undefined;
  const clean: Record<string, unknown> = {};
  for (const [key, fieldSchema] of Object.entries(styleSchema.shape)) {
    const value = raw[key];
    if (value === undefined || value === null) continue;
    const parsed = (fieldSchema as z.ZodTypeAny).safeParse(value);
    if (parsed.success && parsed.data !== undefined) clean[key] = parsed.data;
  }
  return Object.keys(clean).length > 0 ? (clean as StyleProps) : undefined;
}

function sanitizeTheme(raw: unknown): ThemeProps | undefined {
  if (!isRecord(raw)) return undefined;
  const clean: Record<string, unknown> = {};
  for (const [key, fieldSchema] of Object.entries(themeSchema.shape)) {
    const value = raw[key];
    if (value === undefined || value === null) continue;
    const parsed = (fieldSchema as z.ZodTypeAny).safeParse(value);
    if (parsed.success && parsed.data !== undefined) clean[key] = parsed.data;
  }
  return Object.keys(clean).length > 0 ? (clean as ThemeProps) : undefined;
}

export function parseShell(input: unknown, options?: { allowPartial?: boolean }): Layout {
  if (!isRecord(input)) return { nodes: [] };

  const theme = sanitizeTheme(input.theme);
  const nodes: ComponentNode[] = [];

  const heroRaw = input.hero;
  if (isRecord(heroRaw)) {
    const title = heroRaw.title;
    const titleStr = typeof title === "string" ? title : "";
    if (titleStr.length > 0 || options?.allowPartial) {
      const candidate: Record<string, unknown> = {
        type: "hero",
        title: titleStr.length > 0 ? titleStr : "…",
        subtitle: typeof heroRaw.subtitle === "string" ? heroRaw.subtitle : undefined,
        style: sanitizeStyle(heroRaw.style),
      };
      if (candidate.style === undefined) delete candidate.style;
      const parsed = heroNode.safeParse(candidate);
      if (parsed.success) nodes.push(parsed.data);
    }
  }

  const navRaw = input.navigationMenu;
  if (isRecord(navRaw) && Array.isArray(navRaw.menuItems)) {
    const candidate: Record<string, unknown> = {
      type: "navigationMenu",
      menuItems: navRaw.menuItems,
      style: sanitizeStyle(navRaw.style),
    };
    if (candidate.style === undefined) delete candidate.style;
    const parsed = navigationMenuNode.safeParse(candidate);
    if (parsed.success) nodes.push(parsed.data);
  }

  return { theme, nodes };
}

export function parseLayout(input: unknown, options?: { allowEmpty?: boolean }): Layout {
  if (!isRecord(input)) {
    return options?.allowEmpty ? { nodes: [] } : { nodes: [FALLBACK_NODE] };
  }

  const theme = sanitizeTheme(input.theme);
  const rawNodes = Array.isArray(input.nodes) ? input.nodes : [];
  const nodes: ComponentNode[] = [];

  for (const raw of rawNodes) {
    if (!isRecord(raw)) continue;
    const candidate: Record<string, unknown> = { ...raw, style: sanitizeStyle(raw.style) };
    if (candidate.style === undefined) delete candidate.style;
    const parsed = componentNodeSchema.safeParse(candidate);
    if (parsed.success) nodes.push(parsed.data);
  }

  if (nodes.length === 0) {
    return options?.allowEmpty ? { theme, nodes: [] } : { theme, nodes: [FALLBACK_NODE] };
  }
  return { theme, nodes };
}

/** Parse only if the payload actually produced real component nodes. */
export function tryParseLayout(input: unknown): Layout | null {
  const parsed = parseLayout(input, { allowEmpty: true });
  return parsed.nodes.length > 0 ? parsed : null;
}

/**
 * Models sometimes dump the layout as JSON (or a fenced code block) instead of
 * calling renderLayout. Pull out the first balanced `{...}` and try to treat
 * it as a layout, a nodes array, or a single node.
 */
function extractJsonValue(text: string): unknown | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = (fence ? fence[1] : text).trim();
  const start = source.search(/[{[]/);
  if (start === -1) return null;

  const open = source[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(source.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function coerceToLayoutInput(value: unknown): unknown | null {
  if (Array.isArray(value)) return { nodes: value };
  if (!isRecord(value)) return null;
  if (Array.isArray(value.nodes)) return value;
  if (typeof value.type === "string") return { nodes: [value] };
  return null;
}

export function looksLikeLayoutDump(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 8) return false;
  if (/```(?:json)?/i.test(trimmed) && /"type"\s*:/.test(trimmed)) return true;
  if (!/[{[]/.test(trimmed)) return false;
  return /"nodes"\s*:/.test(trimmed) || /"type"\s*:\s*"(hero|cardGrid|article|timeline|skillList|form|navigationMenu|gallery|button|textBlock|linkList|canvas)"/.test(trimmed);
}

function layoutFromProse(text: string): Layout {
  const trimmed = text.trim();
  if (trimmed.length <= 400) {
    return { nodes: [{ type: "textBlock", markdown: trimmed, style: { animation: "fade" } }] };
  }
  const firstLine = trimmed.split(/\n/)[0].replace(/^#+\s*/, "").trim();
  const title = firstLine.length > 0 && firstLine.length <= 80 ? firstLine : "What you asked for";
  const body =
    title === firstLine && !trimmed.startsWith("#")
      ? trimmed.slice(firstLine.length).trim() || trimmed
      : trimmed;
  return {
    nodes: [{ type: "article", title, markdownBody: body, style: { animation: "slide-up" } }],
  };
}

/**
 * Turn a text-only model reply into a canvas layout: prefer a dumped JSON
 * tree, otherwise wrap the prose so the visitor still gets a page.
 */
export function salvageLayoutFromText(text: string): Layout | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const extracted = coerceToLayoutInput(extractJsonValue(trimmed));
  if (extracted) {
    const parsed = tryParseLayout(extracted);
    if (parsed) return parsed;
  }

  if (looksLikeLayoutDump(trimmed)) return { nodes: [FALLBACK_NODE] };
  return layoutFromProse(trimmed);
}
