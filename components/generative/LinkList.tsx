import type { LinkListNode } from "@/lib/tools";

export function LinkList({ node }: { node: LinkListNode }) {
  const justify =
    node.style?.align === "center" ? "center" : node.style?.align === "right" ? "flex-end" : "flex-start";
  return (
    <ul
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "flex",
        flexWrap: "wrap",
        gap: "0.7rem",
        justifyContent: justify,
      }}
    >
      {node.links.map((link) => (
        <li key={link.url}>
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="gen-link">
            {link.label} <span aria-hidden style={{ opacity: 0.7 }}>↗</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
