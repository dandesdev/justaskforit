"use client";

import { useEffect, useState } from "react";
import {
  MODEL_PLACEHOLDERS,
  PROVIDER_LABELS,
  clearSettings,
  saveSettings,
  type ModelProvider,
  type ModelSettings,
} from "@/lib/settings";
import {
  clearStoredSkills,
  hasStoredSkills,
  saveStoredSkills,
  slugifySkillId,
  uniqueSkillId,
  type Skill,
} from "@/lib/customizable-skills";

const PROVIDERS: ModelProvider[] = ["google", "openai", "anthropic"];

type Tab = "model" | "skills";

export function SettingsPanel({
  open,
  current,
  skills,
  defaults,
  onClose,
  onChange,
  onSkillsChange,
}: {
  open: boolean;
  current: ModelSettings | null;
  skills: Skill[];
  defaults: Skill[];
  onClose: () => void;
  onChange: (settings: ModelSettings | null) => void;
  onSkillsChange: (skills: Skill[]) => void;
}) {
  const [tab, setTab] = useState<Tab>("model");
  const [provider, setProvider] = useState<ModelProvider>("google");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [skillsDirty, setSkillsDirty] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProvider(current?.provider ?? "google");
    setModel(current?.model ?? "");
    setApiKey(current?.apiKey ?? "");
    setEditingId(null);
    setSkillsDirty(hasStoredSkills());
    setTab("model");
  }, [open, current]);

  if (!open) return null;

  const modelRequired = provider !== "google";
  const canSaveModel = apiKey.trim().length > 0 && (!modelRequired || model.trim().length > 0);
  const editing = editingId != null ? skills.find((s) => s.id === editingId) : null;
  const isNew = editingId === "__new__";

  function openSkill(skill: Skill) {
    setEditingId(skill.id);
    setDraftName(skill.name);
    setDraftBody(skill.body);
  }

  function openNewSkill() {
    setEditingId("__new__");
    setDraftName("New skill");
    setDraftBody("# New skill\n\nDescribe how the AI should design or behave…\n");
  }

  function persistSkills(next: Skill[]) {
    saveStoredSkills(next);
    setSkillsDirty(true);
    onSkillsChange(next);
  }

  function saveEditedSkill() {
    const name = draftName.trim();
    const body = draftBody.trim();
    if (!name || !body) return;

    if (isNew) {
      const id = uniqueSkillId(slugifySkillId(name), skills);
      persistSkills([...skills, { id, name, body }]);
    } else if (editing) {
      persistSkills(
        skills.map((s) => (s.id === editing.id ? { ...s, name, body } : s)),
      );
    }
    setEditingId(null);
  }

  function deleteSkill(id: string) {
    persistSkills(skills.filter((s) => s.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function restoreDefaults() {
    clearStoredSkills();
    setSkillsDirty(false);
    onSkillsChange(defaults);
    setEditingId(null);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close settings"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/50"
      />
      <div
        role="dialog"
        aria-label="Settings"
        className="fixed bottom-24 left-1/2 z-40 flex max-h-[min(78vh,640px)] w-[min(94vw,520px)] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#161209] shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-3.5">
          <span className="text-xs tracking-widest uppercase opacity-70" style={{ fontFamily: "var(--font-mono)" }}>
            Settings
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded px-2 py-1 text-sm opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>

        <div className="flex shrink-0 gap-1.5 border-b border-white/10 px-5 py-2.5">
          {(
            [
              ["model", "Model"],
              ["skills", "Skills"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setEditingId(null);
              }}
              className={`chip ${tab === id ? "border-[var(--accent)] text-[var(--accent)] opacity-100" : ""}`}
              aria-pressed={tab === id}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {tab === "model" && (
            <>
              <label className="mb-3 block">
                <span className="mb-1.5 block text-[11px] opacity-70" style={{ fontFamily: "var(--font-mono)" }}>
                  provider
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProvider(p)}
                      className={`chip ${provider === p ? "border-[var(--accent)] text-[var(--accent)] opacity-100" : ""}`}
                      aria-pressed={provider === p}
                    >
                      {PROVIDER_LABELS[p]}
                    </button>
                  ))}
                </div>
              </label>

              <label className="mb-3 block">
                <span className="mb-1.5 block text-[11px] opacity-70" style={{ fontFamily: "var(--font-mono)" }}>
                  model {modelRequired ? "(required)" : "(optional)"}
                </span>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={MODEL_PLACEHOLDERS[provider]}
                  className="gen-input"
                  spellCheck={false}
                />
              </label>

              <label className="mb-4 block">
                <span className="mb-1.5 block text-[11px] opacity-70" style={{ fontFamily: "var(--font-mono)" }}>
                  api key
                </span>
                <input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  type="password"
                  placeholder="sk-…"
                  className="gen-input"
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>

              <p className="mb-4 text-[11px] leading-relaxed opacity-50">
                Stored only in this browser and sent with each request so the page can be generated with
                your model. Clear it any time.
              </p>

              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  className="chip"
                  onClick={() => {
                    clearSettings();
                    onChange(null);
                    onClose();
                  }}
                >
                  use site default
                </button>
                <button
                  type="button"
                  disabled={!canSaveModel}
                  className="rounded-full bg-[var(--accent)] px-5 py-1.5 text-sm font-semibold text-[#171204] transition disabled:opacity-40"
                  onClick={() => {
                    const next: ModelSettings = { provider, model: model.trim(), apiKey: apiKey.trim() };
                    saveSettings(next);
                    onChange(next);
                    onClose();
                  }}
                >
                  save
                </button>
              </div>
            </>
          )}

          {tab === "skills" && editingId == null && (
            <>
              <p className="mb-3 text-[11px] leading-relaxed opacity-50">
                Customizable skills are markdown briefs sent to the AI with every page. Edit them here —
                changes stay in this browser. System skills are not listed.
              </p>

              <ul className="mb-4 space-y-1.5">
                {skills.map((skill) => (
                  <li key={skill.id}>
                    <button
                      type="button"
                      onClick={() => openSkill(skill)}
                      className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-left transition hover:border-[var(--accent)]/50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{skill.name}</span>
                        <span
                          className="mt-0.5 block truncate text-[10px] opacity-40"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {skill.id}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] opacity-40">edit</span>
                    </button>
                  </li>
                ))}
                {skills.length === 0 && (
                  <li className="rounded-xl border border-dashed border-white/12 px-3.5 py-6 text-center text-[12px] opacity-45">
                    No customizable skills yet.
                  </li>
                )}
              </ul>

              <div className="flex flex-wrap justify-between gap-2">
                <button type="button" className="chip" disabled={!skillsDirty} onClick={restoreDefaults}>
                  restore defaults
                </button>
                <button
                  type="button"
                  className="rounded-full bg-[var(--accent)] px-5 py-1.5 text-sm font-semibold text-[#171204]"
                  onClick={openNewSkill}
                >
                  add skill
                </button>
              </div>
            </>
          )}

          {tab === "skills" && editingId != null && (
            <>
              <button
                type="button"
                className="mb-3 text-[11px] opacity-55 hover:opacity-100"
                style={{ fontFamily: "var(--font-mono)" }}
                onClick={() => setEditingId(null)}
              >
                ← back to list
              </button>

              <label className="mb-3 block">
                <span className="mb-1.5 block text-[11px] opacity-70" style={{ fontFamily: "var(--font-mono)" }}>
                  name
                </span>
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="gen-input"
                  spellCheck={false}
                />
              </label>

              <label className="mb-4 block">
                <span className="mb-1.5 block text-[11px] opacity-70" style={{ fontFamily: "var(--font-mono)" }}>
                  markdown body
                </span>
                <textarea
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  rows={12}
                  className="gen-input resize-y font-mono text-[12px] leading-relaxed"
                  spellCheck={false}
                />
              </label>

              <div className="flex flex-wrap justify-between gap-2">
                {!isNew ? (
                  <button type="button" className="chip" onClick={() => deleteSkill(editingId)}>
                    delete
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  disabled={!draftName.trim() || !draftBody.trim()}
                  className="rounded-full bg-[var(--accent)] px-5 py-1.5 text-sm font-semibold text-[#171204] transition disabled:opacity-40"
                  onClick={saveEditedSkill}
                >
                  {isNew ? "add" : "save skill"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
