import type { NodeVisualState } from "@/lib/display-node";
import type { TextBlockNode } from "@/lib/tools";
import { Markdown } from "./Markdown";

export function TextBlock({
  node,
  visualState = "stable",
}: {
  node: TextBlockNode;
  visualState?: NodeVisualState;
}) {
  if (visualState === "removing") return null;
  return (
    <div style={{ maxWidth: "46rem", marginInline: node.style?.align === "center" ? "auto" : undefined }}>
      <Markdown text={node.markdown} />
    </div>
  );
}
