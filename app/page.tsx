"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { BuildBanner, BuildIndicator } from "@/components/BuildIndicator";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ComponentRenderer } from "@/components/generative/ComponentRenderer";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Toast } from "@/components/Toast";
import { formatUIEvent, type UIAction } from "@/lib/actions";
import {
  fetchDefaultSkills,
  loadStoredSkills,
  type Skill,
} from "@/lib/customizable-skills";
import { loadSettings, settingsHeaders, type ModelSettings } from "@/lib/settings";
import { themeStyle } from "@/lib/style";
import { useCanvasOrchestrator } from "@/hooks/useCanvasOrchestrator";

const SUGGESTIONS = [
  "show me your resume",
  "what have you built?",
  "tell me about yourself",
  "how do I contact you?",
];

export default function Page() {
  const [toast, setToast] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ModelSettings | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [defaultSkills, setDefaultSkills] = useState<Skill[]>([]);
  const [skillsReady, setSkillsReady] = useState(false);
  const [input, setInput] = useState("");
  const onErrorRef = useRef<() => void>(() => {});
  const mainRef = useRef<HTMLElement>(null);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const skillsRef = useRef(skills);
  skillsRef.current = skills;
  const skillsReadyRef = useRef(skillsReady);
  skillsReadyRef.current = skillsReady;

  useEffect(() => {
    setSettings(loadSettings());
    void (async () => {
      const defaults = await fetchDefaultSkills();
      setDefaultSkills(defaults);
      setSkills(loadStoredSkills() ?? defaults);
      setSkillsReady(true);
    })();
  }, []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: () => settingsHeaders(settingsRef.current),
        body: () => (skillsReadyRef.current ? { skills: skillsRef.current } : {}),
      }),
    [],
  );

  const { messages, sendMessage, status, stop } = useChat({
    transport,
    onError: (error) => {
      onErrorRef.current();
      const msg = error.message?.trim();
      setToast(
        msg && msg.length < 280
          ? msg
          : "The AI hit a snag — your page is untouched. Ask again in a moment.",
      );
    },
  });

  const isBusy = status === "submitted" || status === "streaming";

  const canvas = useCanvasOrchestrator(messages, isBusy);
  onErrorRef.current = canvas.onError;

  const locked = isBusy || canvas.phase !== "idle";
  const busyRef = useRef(false);
  busyRef.current = locked;

  useEffect(() => {
    if (!isBusy) return;
    const timeout = window.setTimeout(() => {
      stop();
      canvas.onError();
      setToast("That took too long — unlocked so you can try again.");
    }, 90_000);
    return () => window.clearTimeout(timeout);
  }, [isBusy, stop, canvas]);

  useEffect(() => {
    if (locked) {
      setPanelOpen(false);
      setSettingsOpen(false);
    }
  }, [locked]);

  const beginTurn = useCallback(
    (label: string) => {
      setPanelOpen(false);
      canvas.beginAsk(label);
      mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    },
    [canvas],
  );

  const ask = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busyRef.current) return;
      beginTurn(trimmed);
      void sendMessage({ text: trimmed });
    },
    [beginTurn, sendMessage],
  );

  const handleAction = useCallback(
    (action: UIAction) => {
      if (busyRef.current) return;

      if (action.kind === "click") {
        beginTurn(action.label);
        void sendMessage({ text: formatUIEvent(action) });
        return;
      }

      // Form submit: actually attempt email delivery first, then tell the
      // model what really happened so its confirmation page is honest.
      beginTurn(action.formTitle);
      void (async () => {
        let delivered = false;
        try {
          const res = await fetch("/api/contact", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              formId: action.formId,
              formTitle: action.formTitle,
              values: action.values,
            }),
          });
          if (res.ok) {
            const data = (await res.json()) as { delivered?: boolean };
            delivered = data.delivered === true;
          }
        } catch {
          delivered = false;
        }
        const outcome = delivered
          ? "The message WAS successfully emailed to the owner."
          : "Email delivery FAILED or is unavailable — tell the visitor honestly and show direct contact links.";
        void sendMessage({ text: `${formatUIEvent(action)} — ${outcome}` });
      })();
    },
    [beginTurn, sendMessage],
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="relative z-20 flex shrink-0 items-center justify-between border-b border-white/10 bg-[var(--bg)] px-4 py-3 md:px-6">
        <div className="flex items-baseline gap-3">
          <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
            justaskforit<span className="text-[var(--accent)]">.com</span>
          </span>
          <span className="hidden text-xs opacity-50 sm:inline" style={{ fontFamily: "var(--font-mono)" }}>
            no menus · no pages · just ask
          </span>
        </div>
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          className="chip"
          aria-expanded={panelOpen}
          disabled={locked}
        >
          {panelOpen ? "hide history" : "history"}
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {canvas.activeQuery && locked ? `Building: ${canvas.activeQuery}` : ""}
        </div>

        <main
          ref={mainRef}
          aria-busy={locked}
          className={`canvas-main absolute inset-0 overflow-y-auto transition-colors duration-500 ${
            locked ? "canvas-locked" : ""
          } ${canvas.phase === "waiting" ? "canvas-waiting" : ""}`}
          style={themeStyle(canvas.theme)}
        >
          <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
            <BuildBanner phase={canvas.phase} query={canvas.activeQuery} />
            <ComponentRenderer
              displayNodes={canvas.displayNodes}
              onAction={handleAction}
              interactive={!locked}
              streaming={canvas.phase === "streaming"}
              buildStub={<BuildIndicator phase={canvas.phase} />}
            />
          </div>
        </main>
      </div>

      <footer className="relative z-20 shrink-0 border-t border-white/10 bg-[var(--bg)] px-4 pt-2.5 pb-3 md:px-6">
        <div className="mx-auto mb-2.5 flex max-w-3xl flex-wrap justify-center gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="chip" disabled={locked} onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
        <form
          className="mx-auto flex max-w-3xl items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
            setInput("");
          }}
        >
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            disabled={locked}
            aria-label="Settings"
            aria-expanded={settingsOpen}
            title={settings ? `Using your ${settings.provider} key` : "Settings"}
            className={`chip shrink-0 px-3 py-2.5 ${settings ? "border-[var(--accent)] text-[var(--accent)]" : ""}`}
          >
            ⚙
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ask for anything — the resume, the projects, the story behind this site…"
            aria-label="Ask the site for anything"
            disabled={locked}
            className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:opacity-40 focus:border-[var(--accent)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={locked || input.trim().length === 0}
            className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[#171204] transition disabled:opacity-40"
          >
            {locked ? "…" : "ask"}
          </button>
        </form>
      </footer>

      <SettingsPanel
        open={settingsOpen && !locked}
        current={settings}
        skills={skills}
        defaults={defaultSkills}
        onClose={() => setSettingsOpen(false)}
        onChange={setSettings}
        onSkillsChange={setSkills}
      />
      <ChatPanel messages={messages} open={panelOpen && !locked} onClose={() => setPanelOpen(false)} />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
