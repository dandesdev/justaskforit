import type { ComponentNode } from "@/lib/tools";

export type NodeVisualState = "stable" | "removing" | "entering" | "transitioning" | "stale";

export type DisplayNode = {
  id: string;
  matchKey: string;
  node: ComponentNode;
  visualState: NodeVisualState;
};

export function layoutFromDisplayNodes(
  nodes: DisplayNode[],
  theme?: import("@/lib/tools").ThemeProps,
): import("@/lib/tools").Layout {
  return {
    theme,
    nodes: nodes.filter((n) => n.visualState !== "removing").map((n) => n.node),
  };
}
