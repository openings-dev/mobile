import AsyncStorage from "@react-native-async-storage/async-storage";

export type NotificationConsentState = "undecided" | "granted" | "denied";

const STORAGE_KEY = "openings:notification-consent";
const STORAGE_VERSION = 1;
const listeners = new Set<(state: NotificationConsentState) => void>();
let cachedState: NotificationConsentState | null = null;

function parseConsent(raw: string | null): NotificationConsentState {
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

export async function readNotificationConsent(): Promise<NotificationConsentState> {
  if (cachedState) return cachedState;
  try {
    cachedState = parseConsent(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    cachedState = "undecided";
  }
  return cachedState;
}

export async function writeNotificationConsent(
  state: Exclude<NotificationConsentState, "undecided">,
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

export function subscribeNotificationConsent(
  listener: (state: NotificationConsentState) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetNotificationConsentForTests(): void {
  cachedState = null;
  listeners.clear();
}
