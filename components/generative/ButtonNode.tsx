"use client";

import type { OnAction } from "@/lib/actions";
import type { ButtonNode as ButtonNodeType } from "@/lib/tools";

export function ButtonNode({ node, onAction }: { node: ButtonNodeType; onAction: OnAction }) {
  return (
    <button
      type="button"
      className={`gen-button ${node.variant === "secondary" ? "gen-button-secondary" : "gen-button-primary"}`}
      onClick={() => onAction({ kind: "click", id: node.id, label: node.label })}
    >
      {node.label}
    </button>
  );
}
