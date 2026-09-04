import AsyncStorage from "@react-native-async-storage/async-storage";

export type AnalyticsConsentState = "undecided" | "granted" | "denied";

const STORAGE_KEY = "openings:analytics-consent";
const STORAGE_VERSION = 1;
const listeners = new Set<(state: AnalyticsConsentState) => void>();
let cachedState: AnalyticsConsentState | null = null;

function parseConsent(raw: string | null): AnalyticsConsentState {
  if (!raw) return "undecided";
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (value.version !== STORAGE_VERSION) return "undecided";
    return value.state === "granted" || value.state === "denied"
      ? value.state
      : "undecided";
  } catch {
    return "undecided";
  }
}

export async function readAnalyticsConsent(): Promise<AnalyticsConsentState> {
  if (cachedState) return cachedState;
  try {
    cachedState = parseConsent(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    cachedState = "undecided";
  }
  return cachedState;
}

export function getCachedAnalyticsConsent(): AnalyticsConsentState {
  return cachedState ?? "undecided";
}

export async function writeAnalyticsConsent(
  state: Exclude<AnalyticsConsentState, "undecided">,
): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      state,
      updatedAt: new Date().toISOString(),
      version: STORAGE_VERSION,
    }));
    cachedState = state;
    listeners.forEach((listener) => listener(state));
    return true;
  } catch {
    return false;
  }
}

export function subscribeAnalyticsConsent(
  listener: (state: AnalyticsConsentState) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetAnalyticsConsentForTests(): void {
  cachedState = null;
  listeners.clear();
}
