"use client";

import { useState } from "react";
import type { OnAction } from "@/lib/actions";
import type { FormNode } from "@/lib/tools";

export function FormBlock({ node, onAction }: { node: FormNode; onAction: OnAction }) {
  const [values, setValues] = useState<Record<string, string>>({});

  const setValue = (name: string, value: string) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  return (
    <form
      style={{ maxWidth: "34rem", marginInline: node.style?.align === "center" ? "auto" : undefined, textAlign: "left" }}
      onSubmit={(e) => {
        e.preventDefault();
        onAction({ kind: "submit", formId: node.id, formTitle: node.title, values });
      }}
    >
      <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "1.1rem" }}>{node.title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
        {node.fields.map((field) => (
          <label key={field.name} style={{ display: "block" }}>
            <span
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.06em",
                opacity: 0.75,
                marginBottom: "0.35rem",
              }}
            >
              {field.label}
            </span>
            {field.type === "textarea" ? (
              <textarea
                className="gen-input"
                rows={4}
                value={values[field.name] ?? ""}
                onChange={(e) => setValue(field.name, e.target.value)}
              />
            ) : (
              <input
                className="gen-input"
                type={field.type}
                value={values[field.name] ?? ""}
                onChange={(e) => setValue(field.name, e.target.value)}
              />
            )}
          </label>
        ))}
      </div>
      <button type="submit" className="gen-button gen-button-primary" style={{ marginTop: "1.2rem" }}>
        {node.submitLabel}
      </button>
    </form>
  );
}
