"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CanvasNode } from "@/lib/tools";

const P5_URL = "/vendor/p5.min.js";
const MAX_SKETCH_CHARS = 20_000;

let p5SourcePromise: Promise<string> | null = null;

function loadP5Source(): Promise<string> {
  if (!p5SourcePromise) {
    p5SourcePromise = fetch(P5_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load p5 (${res.status})`);
        return res.text();
      })
      .catch((err) => {
        p5SourcePromise = null;
        throw err;
      });
  }
  return p5SourcePromise;
}

/** Keep AI sketch source from breaking out of the iframe srcdoc script tag. */
function sanitizeSketch(raw: string): string {
  return raw
    .slice(0, MAX_SKETCH_CHARS)
    .replace(/<\/script/gi, "<\\/script")
    .replace(/<!--/g, "<\\!--");
}

function buildSrcDoc(p5Source: string, sketch: string, height: number): string {
  const code = sanitizeSketch(sketch);
  // p5 is inlined so the iframe can stay sandboxed without allow-same-origin
  // (relative script src would fail under an opaque origin).
  const safeP5 = p5Source.replace(/<\/script/gi, "<\\/script");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none';"
  />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      width: 100%;
      height: 100%;
      background: transparent;
    }
    main { margin: 0; }
    canvas { display: block; margin: 0 auto; }
    #err {
      display: none;
      font: 12px/1.4 ui-monospace, monospace;
      color: #c45c4a;
      padding: 12px;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="err"></div>
  <script>${safeP5}</script>
  <script>
    window.SKETCH_HEIGHT = ${height};
    window.addEventListener("error", function (e) {
      var errEl = document.getElementById("err");
      if (!errEl) return;
      errEl.style.display = "block";
      errEl.textContent = String((e.error && e.error.message) || e.message || e.error || "Sketch error");
    });
  </script>
  <script>
${code}
  </script>
</body>
</html>`;
}

/**
 * Renders an AI-authored p5.js sketch inside a sandboxed iframe.
 * Scripts run, but the frame has an opaque origin — no parent DOM/storage access.
 */
export function CanvasSketch({ node }: { node: CanvasNode }) {
  const height = node.height ?? 400;
  const hostRef = useRef<HTMLDivElement>(null);
  const [p5Source, setP5Source] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [readySketch, setReadySketch] = useState(node.sketch);
  const [frameKey, setFrameKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadP5Source()
      .then((src) => {
        if (!cancelled) setP5Source(src);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load p5");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounce sketch updates so partial stream repairs don't thrash the iframe.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReadySketch(node.sketch);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [node.sketch]);

  useEffect(() => {
    setFrameKey((k) => k + 1);
  }, [readySketch, height]);

  const srcDoc = useMemo(() => {
    if (!p5Source) return null;
    return buildSrcDoc(p5Source, readySketch, height);
  }, [p5Source, readySketch, height]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof ResizeObserver === "undefined") return;
    let last = host.clientWidth;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (Math.abs(w - last) > 24) {
        last = w;
        setFrameKey((k) => k + 1);
      }
    });
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  const hasSetup = /\b(function\s+setup|setup\s*=\s*function|const\s+setup|let\s+setup|var\s+setup)/.test(
    readySketch,
  );

  return (
    <figure style={{ margin: 0 }}>
      {node.title && (
        <figcaption
          style={{
            fontSize: "0.9rem",
            opacity: 0.78,
            marginBottom: "0.65rem",
            letterSpacing: "0.01em",
          }}
        >
          {node.title}
        </figcaption>
      )}
      <div
        ref={hostRef}
        style={{
          width: "100%",
          height,
          borderRadius: "var(--radius, 14px)",
          overflow: "hidden",
          background: "color-mix(in srgb, currentColor 6%, transparent)",
          position: "relative",
        }}
      >
        {loadError ? (
          <div style={{ padding: "1rem", fontSize: "0.85rem", opacity: 0.7 }}>{loadError}</div>
        ) : srcDoc && hasSetup ? (
          <iframe
            key={frameKey}
            title={node.title ?? "Interactive sketch"}
            srcDoc={srcDoc}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            style={{
              width: "100%",
              height: "100%",
              border: 0,
              display: "block",
              background: "transparent",
            }}
          />
        ) : (
          <div className="shimmer" style={{ width: "100%", height: "100%" }} aria-hidden />
        )}
      </div>
    </figure>
  );
}
