import type { ComponentNode } from "@/lib/tools";

/** Stable fingerprint for diff matching between layout passes. */
export function nodeMatchKey(node: ComponentNode, index: number): string {
  switch (node.type) {
    case "hero":
      return `hero:${node.title.slice(0, 80)}`;
    case "article":
      return `article:${node.title.slice(0, 80)}`;
    case "textBlock":
      return `textBlock:${node.markdown.slice(0, 40)}`;
    case "button":
      return `button:${node.id}`;
    case "form":
      return `form:${node.id}`;
    case "cardGrid":
      return `cardGrid:${node.cards.map((c) => c.id).join("|")}`;
    case "navigationMenu":
      return `nav:${node.menuItems.map((m) => m.id).join("|")}`;
    case "timeline":
      return `timeline:${node.timelineItems[0]?.title ?? index}`;
    case "skillList":
      return `skills:${node.groups[0]?.label ?? index}`;
    case "gallery":
      return `gallery:${node.images[0]?.imageQuery ?? index}`;
    case "linkList":
      return `links:${node.links[0]?.url ?? index}`;
    case "canvas":
      return `canvas:${(node.title ?? node.sketch.slice(0, 48)).slice(0, 80)}`;
    default:
      return `node:${index}`;
  }
}

export function newDisplayId(matchKey: string): string {
  return `${matchKey}::${Math.random().toString(36).slice(2, 9)}`;
}

/** Fisher–Yates shuffle of [0..length). */
export function shuffleIndices(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}
