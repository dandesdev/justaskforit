"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/components/AnimatedText";
import type { CanvasBuildPhase } from "@/hooks/useCanvasOrchestrator";

const WAITING_LINES = [
  "reading your question…",
  "digging through what I know…",
  "picking a palette…",
  "sketching the layout…",
  "choosing typography…",
];

const STREAMING_LINES = [
  "building this page…",
  "placing the next section…",
  "polishing type and color…",
  "arranging the details…",
];

const TICK_MS = 1700;

function Ticker({ lines }: { lines: string[] }) {
  const [index, setIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const t = setInterval(() => setIndex((i) => i + 1), TICK_MS);
    return () => clearInterval(t);
  }, [reducedMotion, lines]);

  return (
    <span className="flex items-center gap-2.5 text-xs" style={{ fontFamily: "var(--font-mono)" }}>
      <span className="flex items-center gap-1" aria-hidden>
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </span>
      <span key={index % lines.length} className="build-ticker-line opacity-80">
        {lines[index % lines.length]}
      </span>
    </span>
  );
}

/**
 * Sticky pill at the top of the canvas while a page is being asked for or
 * assembled — the always-moving "the AI is on it" signal, floating above the
 * old page instead of destroying it.
 */
export function BuildBanner({ phase, query }: { phase: CanvasBuildPhase; query: string | null }) {
  if (phase === "idle") return null;
  return (
    <div className="build-banner" role="status">
      <Ticker lines={phase === "waiting" ? WAITING_LINES : STREAMING_LINES} />
      {query && (
        <span className="max-w-52 truncate text-xs opacity-50" style={{ fontFamily: "var(--font-mono)" }}>
          {query}
        </span>
      )}
    </div>
  );
}

/**
 * Slim shimmer stub rendered right under the newest streamed component,
 * marking where the next section will land.
 */
export function BuildIndicator({ phase }: { phase: CanvasBuildPhase }) {
  if (phase !== "streaming") return null;
  return (
    <div className="build-indicator mt-8" aria-hidden="true">
      <div className="shimmer h-6 w-2/5" />
      <div className="shimmer mt-2 h-4 w-1/4" style={{ animationDelay: "0.2s" }} />
    </div>
  );
}
