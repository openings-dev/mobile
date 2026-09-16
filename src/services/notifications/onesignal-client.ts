import { OneSignal } from "react-native-onesignal";

import type { NotificationConsentState } from "./consent";

const JOB_ID_PATTERN = /^gh_[0-9a-f]{24}$/;

interface NotificationClickPayload {
  jobId: string;
  type: "openings.job";
  version: 1;
}

function parseNotificationClickPayload(value: unknown): NotificationClickPayload | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (candidate.type !== "openings.job" || candidate.version !== 1) return null;
  if (typeof candidate.jobId !== "string" || !JOB_ID_PATTERN.test(candidate.jobId)) return null;
  return { jobId: candidate.jobId, type: "openings.job", version: 1 };
}

let initialized = false;

export function initOneSignal(consent: NotificationConsentState): boolean {
  const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId || initialized) return initialized;

  try {
    OneSignal.setConsentRequired(true);
    OneSignal.initialize(appId);
    initialized = true;
    if (consent === "granted") {
      OneSignal.setConsentGiven(true);
    } else {
      OneSignal.setConsentGiven(false);
      OneSignal.User.pushSubscription.optOut();
    }
    return true;
  } catch {
    return false;
  }
}

export async function grantOneSignalConsentAndRequestPermission(): Promise<boolean> {
  if (!initialized) return false;
  try {
    OneSignal.setConsentGiven(true);
    const granted = await OneSignal.Notifications.requestPermission(false);
    if (granted) OneSignal.User.pushSubscription.optIn();
    return granted;
  } catch {
    return false;
  }
}

export function denyOneSignalConsent(): void {
  if (!initialized) return;
  try {
    OneSignal.setConsentGiven(false);
    OneSignal.User.pushSubscription.optOut();
  } catch {
    // Notification failures never block the application.
  }
}

export function addNotificationClickListener(onJob: (jobId: string) => void): () => void {
  const listener = (event: { notification?: { additionalData?: unknown } }): void => {
    const payload = parseNotificationClickPayload(event.notification?.additionalData);
    if (payload) onJob(payload.jobId);
  };
  try {
    OneSignal.Notifications.addEventListener("click", listener);
  } catch {
    return () => {};
  }
  return () => {
    try {
      OneSignal.Notifications.removeEventListener("click", listener);
    } catch {
      // Listener cleanup failure must not affect app navigation.
    }
  };
}

export function resetOneSignalClientForTests(): void {
  initialized = false;
}
