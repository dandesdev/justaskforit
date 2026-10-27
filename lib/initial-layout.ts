import type { Layout } from "./tools";

/** Static homepage shown on first paint — no AI round-trip required. */
export const INITIAL_LAYOUT: Layout = {
  nodes: [
    {
      type: "hero",
      title: "A terrible idea for a website",
      subtitle: "Ask for anything, and It might have what you need",
      style: { align: "center" },
    },
  ],
};
