import type { NodeVisualState } from "@/lib/display-node";
import type { ArticleNode } from "@/lib/tools";
import { AnimatedText } from "@/components/AnimatedText";
import { Markdown } from "./Markdown";

export function Article({
  node,
  visualState = "stable",
}: {
  node: ArticleNode;
  visualState?: NodeVisualState;
}) {
  const deleting = visualState === "removing";
  return (
    <article style={{ maxWidth: "46rem", marginInline: node.style?.align === "center" ? "auto" : undefined }}>
      <AnimatedText
        as="h2"
        text={node.title}
        mode={deleting ? "deleting" : "static"}
        style={{
          fontSize: "clamp(1.6rem, 3.5vw, 2.3rem)",
          fontWeight: 700,
          letterSpacing: "-0.015em",
          marginBottom: "1rem",
          textWrap: "balance",
        }}
      />
      {!deleting && <Markdown text={node.markdownBody} />}
    </article>
  );
}
