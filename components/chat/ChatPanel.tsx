"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { describeUIEvent, isSessionStart, isUIEvent } from "@/lib/actions";

type PartLike = { type: string; text?: string };

function textOf(message: UIMessage): string {
  const parts = message.parts as unknown as PartLike[];
  return parts
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join(" ")
    .trim();
}

function hasLayout(message: UIMessage): boolean {
  // Assistant replies are JSONL layout text (legacy sessions may still carry tool parts).
  const parts = message.parts as unknown as PartLike[];
  return parts.some(
    (p) => p.type === "tool-renderLayout" || (p.type === "text" && Boolean(p.text?.trim())),
  );
}

export function ChatPanel({
  messages,
  open,
  onClose,
}: {
  messages: UIMessage[];
  open: boolean;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close history"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}
      <aside
        aria-label="Conversation history"
        className={`fixed top-0 right-0 z-40 flex h-full w-[min(90vw,380px)] flex-col border-l border-white/10 bg-[#161209] shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="text-xs tracking-widest uppercase opacity-70" style={{ fontFamily: "var(--font-mono)" }}>
            Conversation
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded px-2 py-1 text-sm opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>

        <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => {
            const text = textOf(message);

            if (message.role === "user") {
              if (isSessionStart(text)) return null;
              if (isUIEvent(text)) {
                return (
                  <div
                    key={message.id}
                    className="self-end rounded-full border border-white/15 px-2.5 py-1 text-[11px] opacity-70"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    ⚡ {describeUIEvent(text)}
                  </div>
                );
              }
              return (
                <div
                  key={message.id}
                  className="max-h-28 max-w-[85%] overflow-y-auto self-end rounded-2xl rounded-br-sm bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] px-3.5 py-2 text-sm"
                >
                  {text}
                </div>
              );
            }

            if (message.role === "assistant") {
              if (!hasLayout(message) && !text) return null;
              return (
                <div
                  key={message.id}
                  className="max-w-[85%] self-start rounded-2xl rounded-bl-sm bg-white/5 px-3.5 py-2 text-sm"
                >
                  <p
                    className="text-[10px] tracking-wider text-[var(--accent)] uppercase opacity-80"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    ◆ page redesigned
                  </p>
                </div>
              );
            }

            return null;
          })}
          {messages.length <= 1 && (
            <p className="mt-2 text-xs leading-relaxed opacity-50">
              Your questions, clicks, and page redesigns will appear here — the site never replies in
              chat, only on the canvas.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
