/**
 * Bring-your-own-key model settings. Stored in localStorage only — the key is
 * sent per-request to our own API route, never to third parties from the
 * browser directly.
 */

export type ModelProvider = "google" | "openai" | "anthropic";

export type ModelSettings = {
  provider: ModelProvider;
  model: string;
  apiKey: string;
};

export const PROVIDER_LABELS: Record<ModelProvider, string> = {
  google: "Google Gemini",
  openai: "OpenAI",
  anthropic: "Anthropic",
};

export const MODEL_PLACEHOLDERS: Record<ModelProvider, string> = {
  google: "gemini-3.6-flash",
  openai: "e.g. gpt-5.2-mini",
  anthropic: "e.g. claude-sonnet-5",
};

const STORAGE_KEY = "jafi-model-settings";

export function loadSettings(): ModelSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ModelSettings>;
    if (
      (parsed.provider === "google" || parsed.provider === "openai" || parsed.provider === "anthropic") &&
      typeof parsed.model === "string" &&
      typeof parsed.apiKey === "string"
    ) {
      return { provider: parsed.provider, model: parsed.model, apiKey: parsed.apiKey };
    }
  } catch {
    // Corrupt entry — treat as unset.
  }
  return null;
}

export function saveSettings(settings: ModelSettings): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function clearSettings(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Extra request headers for /api/chat when a custom model is configured. */
export function settingsHeaders(settings: ModelSettings | null): Record<string, string> {
  if (!settings || !settings.apiKey.trim()) return {};
  return {
    "x-model-provider": settings.provider,
    "x-model-id": settings.model.trim(),
    "x-model-api-key": settings.apiKey.trim(),
  };
}
