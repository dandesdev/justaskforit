# justaskforit.com

A personal portfolio website with **no pages, no menus, and no navigation**. Visitors talk to
the site, and an AI designs every "page" on demand by streaming a structured component tree
that a whitelisted React renderer turns into real UI. Every fact comes exclusively from
markdown files in `/content` — the AI has no web access and no outside knowledge about the owner.

> The gimmick: don't browse. **Just ask for it.**

## Setup

```bash
npm install
copy .env.example .env.local   # (cp on macOS/Linux)
# put your Gemini key in .env.local:
#   GOOGLE_GENERATIVE_AI_API_KEY=...
npm run dev
```

Get a free key at [Google AI Studio](https://aistudio.google.com/apikey). The key is used
server-side only. Optionally set `GEMINI_MODEL` to override the default `gemini-3.6-flash`.

## Architecture

```
                          ┌────────────────────────────────────────────┐
                          │                 BROWSER                    │
                          │                                            │
  "show me your resume"   │  app/page.tsx (single page, client state)  │
  ──────────────────────▶ │   ├─ chat input + suggestion chips         │
                          │   ├─ collapsible history panel             │
  click / form submit     │   └─ CANVAS                                │
  ──[UI_EVENT] message──▶ │       └─ ComponentRenderer (whitelist)     │
                          │           Hero · CardGrid · Timeline · …   │
                          └───────────────┬────────────────▲───────────┘
                                          │ POST messages  │ streamed text +
                                          │ (client memory)│ renderLayout tool call
                          ┌───────────────▼────────────────┴───────────┐
                          │       app/api/chat/route.ts (server)       │
                          │   ├─ per-IP rate limit (in-memory)         │
                          │   ├─ lib/content.ts  ── reads /content/*.md│
                          │   ├─ lib/prompt.ts   ── system prompt      │
                          │   └─ streamText(Gemini, tools:renderLayout)│
                          └───────────────┬────────────────────────────┘
                                          │ Zod-validated tool schema
                          ┌───────────────▼────────────────────────────┐
                          │        Google Gemini (flash model)         │
                          │   grounded ONLY in the injected /content   │
                          └────────────────────────────────────────────┘
```

Flow per turn:

1. The client sends the whole message history (no database — state lives in client memory).
2. The route reads **all** `.md` files in `/content` at request time and injects them into the
   system prompt as labeled sections.
3. Gemini streams back 1–2 sentences of guiding text **plus** one `renderLayout` tool call
   containing a complete component tree that replaces the canvas.
4. Every node is validated against a strict Zod discriminated union before rendering; style
   values are sanitized (no `url(`, `expression`, `javascript:`, semicolons, quotes). Anything
   invalid is dropped or replaced with a fallback TextBlock — the page never crashes.
5. Clicks and form submissions loop back as synthetic `[UI_EVENT]` user messages, so
   interactions drive the next layout without any typing.

## Editing content (the whole point)

Everything the AI knows about the owner lives in `/content`:

| File          | Purpose                                             |
| ------------- | --------------------------------------------------- |
| `_meta.md`    | Owner name, tone/voice, presentation instructions   |
| `about.md`    | Bio, background, personality, interests             |
| `resume.md`   | Work experience, education, skills                  |
| `projects.md` | Portfolio projects, tech, outcomes                  |
| `contact.md`  | Email and external links                            |

Edit any file, or **add new `.md` files** — they are read fresh on every request, so new
content is available on the next message with zero code changes and no restart.

**Token-size note:** the entire `/content` folder is injected into the system prompt on every
request. That's the right call while it's small. If your content grows past roughly
**~50k tokens** (~200 KB of markdown), switch to a retrieval approach: chunk the files, embed
them, and inject only the sections relevant to the current question instead of everything.

## Adding a component to the palette

The model can only render whitelisted components — never arbitrary HTML. To add one, e.g.
`Quote`:

1. **Schema** — in `lib/tools.ts`:
   - add a strict node (`z.object({ type: z.literal("quote"), text: z.string(), author: z.string().optional(), style: styleSchema.optional() })`) and include it in `componentNodeSchema`;
   - add its fields to `renderLayoutInputSchema`'s flat node object (Gemini's function-calling
     API rejects `anyOf`/`const`/recursive schemas, which is why the schema the model sees is a
     single flat shape with a `type` enum, while the strict discriminated union gates rendering).
2. **Renderer** — create `components/generative/Quote.tsx` and add a `case "quote"` to the
   switch in `components/generative/ComponentRenderer.tsx`.
3. **System prompt** — mention the new component and its fields in the palette list inside
   `lib/prompt.ts` so the model knows it exists.

## Security & robustness notes

- **Style injection:** color values are checked against an allowlist pattern (letters, digits,
  `#%(),./+-` and spaces) and a denylist (`url(`, `expression`, `javascript`, …). Colons,
  semicolons, quotes, and angle brackets never pass, so a malicious
  `url(javascript:...)` is rejected while `linear-gradient(135deg, #111, #333)` works.
- **Markdown:** rendered with react-markdown, which never emits raw HTML; links are restricted
  to `http(s)`/`mailto` and open with `rel="noopener noreferrer"`.
- **Model output:** parsed with a salvaging validator — invalid style fields are dropped,
  invalid nodes are skipped, and a fully broken payload renders a fallback TextBlock.
- **Rate limiting:** in-memory sliding window, 20 requests/min per IP (`lib/rate-limit.ts`).
  For production on serverless/multi-instance, swap in Upstash Redis (snippet in the file).

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Vercel AI SDK (`ai`,
`@ai-sdk/google`, `@ai-sdk/react`) · Google Gemini · Zod · Tailwind CSS 4
