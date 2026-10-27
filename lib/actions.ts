/**
 * The interaction loopback: every interactive element rendered on the canvas
 * reports back through a UIAction, which the page turns into a synthetic
 * user message so the AI can respond with a new layout.
 */

export type UIAction =
  | { kind: "click"; id: string; label: string }
  | { kind: "submit"; formId: string; formTitle: string; values: Record<string, string> };

export type OnAction = (action: UIAction) => void;

export const SESSION_START_MESSAGE =
  "[SESSION_START] A new visitor just landed on justaskforit.com. Greet them by the owner's name and render the homepage.";

export function formatUIEvent(action: UIAction): string {
  if (action.kind === "click") {
    return `[UI_EVENT] clicked "${action.label}" (id: ${action.id})`;
  }
  return `[UI_EVENT] submitted form "${action.formTitle}" (id: ${action.formId}) with values: ${JSON.stringify(action.values)}`;
}

/** Pretty label for showing UI events in the chat history panel. */
export function describeUIEvent(text: string): string {
  return text.replace(/^\[UI_EVENT\]\s*/, "");
}

export function isUIEvent(text: string): boolean {
  return text.startsWith("[UI_EVENT]");
}

export function isSessionStart(text: string): boolean {
  return text.startsWith("[SESSION_START]");
}
