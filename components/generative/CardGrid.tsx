"use client";

import type { NodeVisualState } from "@/lib/display-node";
import type { CardGridNode } from "@/lib/tools";
import { AnimatedText } from "@/components/AnimatedText";
import { gridColumns } from "@/lib/style";
export function CardGrid({
  node,
  visualState = "stable",
  onAction,
}: {
  node: CardGridNode;
  visualState?: NodeVisualState;
  onAction: import("@/lib/actions").OnAction;
}) {
  const deleting = visualState === "removing";  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        gridTemplateColumns: gridColumns(node.style?.columns),
      }}
    >
      {node.cards.map((card) => {
        const interactive = Boolean(card.actionId);
        return (
          <div key={card.id} className="gen-card">
            <AnimatedText
              as="h3"
              text={card.title}
              mode={deleting ? "deleting" : "static"}
              style={{ fontSize: "1.15rem", fontWeight: 650, marginBottom: "0.5rem" }}
            />
            {!deleting && (
              <p style={{ opacity: 0.82, lineHeight: 1.55, fontSize: "0.95rem", flex: 1 }}>{card.body}</p>
            )}            {!deleting && interactive && (
              <button
                type="button"
                className="gen-card-action"
                onClick={() =>
                  onAction({
                    kind: "click",
                    id: card.actionId ?? card.id,
                    label: card.actionLabel ?? card.title,
                  })
                }
              >
                {card.actionLabel ?? "Open"} <span aria-hidden>→</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
