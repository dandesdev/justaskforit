"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export type TextAnimMode = "static" | "deleting";

const DELETE_CHARS_PER_SEC = 28;

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export function AnimatedText({
  text,
  mode = "static",
  className,
  style,
  as: Tag = "span",
  onDeleteComplete,
}: {
  text: string;
  mode?: TextAnimMode;
  className?: string;
  style?: CSSProperties;
  as?: "span" | "p" | "h1" | "h2" | "h3";
  onDeleteComplete?: () => void;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(text);
  const completeRef = useRef(onDeleteComplete);
  completeRef.current = onDeleteComplete;

  useEffect(() => {
    if (mode !== "deleting" || reducedMotion) {
      setVisible(text);
      if (mode === "deleting" && reducedMotion) completeRef.current?.();
      return;
    }

    setVisible(text);
    if (text.length === 0) {
      completeRef.current?.();
      return;
    }

    let len = text.length;
    const tickMs = Math.max(16, Math.round(1000 / DELETE_CHARS_PER_SEC));
    const timer = setInterval(() => {
      len -= 1;
      if (len <= 0) {
        setVisible("");
        clearInterval(timer);
        completeRef.current?.();
      } else {
        setVisible(text.slice(0, len));
      }
    }, tickMs);

    return () => clearInterval(timer);
  }, [mode, reducedMotion, text]);

  useEffect(() => {
    if (mode === "static") setVisible(text);
  }, [mode, text]);

  return (
    <Tag className={className} style={style}>
      {visible}
      {mode === "deleting" && !reducedMotion && visible.length > 0 && (
        <span className="animated-text-caret" aria-hidden>
          |
        </span>
      )}
    </Tag>
  );
}
