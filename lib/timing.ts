/** Dev-only timing markers for tuning adaptive teardown (see console in development). */
export type AskTiming = {
  askAt: number;
  firstPayloadAt: number | null;
  completeAt: number | null;
};

let active: AskTiming | null = null;

export function timingMarkAsk(): void {
  active = { askAt: performance.now(), firstPayloadAt: null, completeAt: null };
  if (process.env.NODE_ENV === "development") {
    console.info("[canvas-timing] ask submitted");
  }
}

export function timingMarkFirstPayload(source: string): void {
  if (!active || active.firstPayloadAt !== null) return;
  active.firstPayloadAt = performance.now();
  if (process.env.NODE_ENV === "development") {
    const ms = Math.round(active.firstPayloadAt - active.askAt);
    console.info(`[canvas-timing] first payload (${source}) +${ms}ms`);
  }
}

export function timingMarkComplete(): void {
  if (!active) return;
  active.completeAt = performance.now();
  if (process.env.NODE_ENV === "development") {
    const total = Math.round(active.completeAt - active.askAt);
    const first = active.firstPayloadAt
      ? Math.round(active.firstPayloadAt - active.askAt)
      : null;
    console.info(`[canvas-timing] complete +${total}ms`, first !== null ? `(first payload +${first}ms)` : "");
  }
  active = null;
}

export function timingCancel(): void {
  active = null;
}
