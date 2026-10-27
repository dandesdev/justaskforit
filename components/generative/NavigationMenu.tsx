"use client";

import type { OnAction } from "@/lib/actions";
import type { NavigationMenuNode } from "@/lib/tools";

export function NavigationMenu({ node, onAction }: { node: NavigationMenuNode; onAction: OnAction }) {
  const justify =
    node.style?.align === "center" ? "center" : node.style?.align === "right" ? "flex-end" : "flex-start";
  return (
    <nav style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", justifyContent: justify }}>
      {node.menuItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className="gen-nav-item"
          onClick={() => onAction({ kind: "click", id: item.id, label: item.label })}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
