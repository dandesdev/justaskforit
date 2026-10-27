import type { SkillListNode } from "@/lib/tools";

export function SkillList({ node }: { node: SkillListNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
      {node.groups.map((group) => (
        <div key={group.label}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              opacity: 0.65,
              marginBottom: "0.6rem",
            }}
          >
            {group.label}
          </div>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              justifyContent: node.style?.align === "center" ? "center" : "flex-start",
            }}
          >
            {group.skills.map((skill) => (
              <li
                key={skill}
                style={{
                  border: "1px solid color-mix(in srgb, currentColor 22%, transparent)",
                  background: "color-mix(in srgb, currentColor 6%, transparent)",
                  borderRadius: "999px",
                  padding: "0.35rem 0.85rem",
                  fontSize: "0.88rem",
                }}
              >
                {skill}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
