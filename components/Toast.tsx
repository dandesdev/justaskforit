"use client";

import { useEffect } from "react";

export function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return;
    const duration = message.length > 80 ? 10_000 : 6000;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="alert"
      className="anim-fade fixed right-4 bottom-32 z-50 max-w-sm rounded-xl border border-red-400/40 bg-[#3a1414] px-4 py-3 text-sm leading-relaxed text-red-100 shadow-2xl"
    >
      {message}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-3 font-bold opacity-60 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
