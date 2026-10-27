/**
 * Compact summaries of past layouts for model history. Full JSON made the model
 * copy previous pages verbatim when revisiting resume ↔ contact.
 */
export function summarizeLayoutInput(input: unknown): string {
  if (typeof input !== "object" || input === null) return "unknown layout";

  const record = input as {
    theme?: { background?: string; textColor?: string; fontStyle?: string };
    nodes?: unknown[];
    hero?: { title?: string };
    navigationMenu?: unknown;
  };

  const theme = record.theme;
  const nodes = Array.isArray(record.nodes) ? record.nodes : [];

  const themeParts: string[] = [];
  if (theme?.fontStyle) themeParts.push(`font=${theme.fontStyle}`);
  if (theme?.background) themeParts.push(`bg=${theme.background.slice(0, 72)}`);
  if (theme?.textColor) themeParts.push(`text=${theme.textColor.slice(0, 40)}`);

  const types = nodes
    .map((n) =>
      typeof n === "object" && n !== null && "type" in n ? String((n as { type: unknown }).type) : null,
    )
    .filter((t): t is string => Boolean(t));

  if (record.hero) types.unshift("hero");
  if (record.navigationMenu) types.push("navigationMenu");

  const heroInNodes = nodes.find(
    (n) => typeof n === "object" && n !== null && (n as { type?: string }).type === "hero",
  ) as { title?: string } | undefined;
  const shellHero = record.hero?.title;
  const topicTitle = heroInNodes?.title ?? shellHero;
  const topic = topicTitle ? `; headline="${topicTitle.slice(0, 64)}"` : "";

  return `${themeParts.join(", ") || "default theme"}; components: ${types.join(" → ") || "none"}${topic}`;
}

export function layoutHistoryNote(input: unknown): string {
  return `[Previous page (summary only — do NOT reuse this theme, colors, or component stack): ${summarizeLayoutInput(input)}]`;
}
