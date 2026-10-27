import type { NodeVisualState } from "@/lib/display-node";
import type { HeroNode } from "@/lib/tools";
import { AnimatedText } from "@/components/AnimatedText";

export function Hero({ node, visualState = "stable" }: { node: HeroNode; visualState?: NodeVisualState }) {
  const centered = node.style?.align === "center";
  const deleting = visualState === "removing";
  const titleStyle = {
    fontSize: "clamp(2.4rem, 6vw, 4.4rem)",
    lineHeight: 1.04,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    textWrap: "balance" as const,
  };
  const subtitleStyle = {
    marginTop: "1.1rem",
    fontSize: "clamp(1.05rem, 2.2vw, 1.35rem)",
    lineHeight: 1.5,
    opacity: 0.88,
    maxWidth: "44rem",
    marginInline: centered ? "auto" : undefined,
    textWrap: "pretty" as const,
  };

  return (
    <div style={{ padding: "1.5rem 0", textAlign: centered ? "center" : undefined }}>
      <AnimatedText as="h1" text={node.title} mode={deleting ? "deleting" : "static"} style={titleStyle} />
      {node.subtitle && (
        <AnimatedText
          as="p"
          text={node.subtitle}
          mode={deleting ? "deleting" : "static"}
          style={subtitleStyle}
        />
      )}
    </div>
  );
}
