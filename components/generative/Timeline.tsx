import type { TimelineNode } from "@/lib/tools";

export function Timeline({ node }: { node: TimelineNode }) {
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {node.timelineItems.map((item, i) => (
        <li
          key={i}
          style={{
            position: "relative",
            paddingLeft: "2rem",
            paddingBottom: i === node.timelineItems.length - 1 ? 0 : "1.9rem",
            borderLeft:
              i === node.timelineItems.length - 1
                ? "2px solid transparent"
                : "2px solid color-mix(in srgb, currentColor 18%, transparent)",
            marginLeft: "0.4rem",
            textAlign: "left",
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: "-0.48rem",
              top: "0.2rem",
              width: "0.9rem",
              height: "0.9rem",
              borderRadius: "999px",
              background: "var(--accent)",
              boxShadow: "0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent)",
            }}
          />
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.78rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            {item.period}
          </div>
          <div style={{ fontWeight: 650, fontSize: "1.1rem", margin: "0.25rem 0" }}>{item.title}</div>
          <p style={{ opacity: 0.8, lineHeight: 1.55, fontSize: "0.95rem", maxWidth: "40rem" }}>
            {item.description}
          </p>
        </li>
      ))}
    </ol>
  );
}
