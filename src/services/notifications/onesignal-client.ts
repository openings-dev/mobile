import { OneSignal } from "react-native-onesignal";

import type { NotificationConsentState } from "./consent";

const JOB_ID_PATTERN = /^gh_[0-9a-f]{24}$/;

interface NotificationClickPayload {
  jobId: string;
  type: "openings.job";
  version: 1;
}

interface NotificationClickEvent {
  notification?: { additionalData?: unknown };
}

interface NotificationClickRegistration {
  active: boolean;
  attached: boolean;
  listener: (event: NotificationClickEvent) => void;
}

function parseNotificationClickPayload(value: unknown): NotificationClickPayload | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (candidate.type !== "openings.job" || candidate.version !== 1) return null;
  if (typeof candidate.jobId !== "string" || !JOB_ID_PATTERN.test(candidate.jobId)) return null;
  return { jobId: candidate.jobId, type: "openings.job", version: 1 };
}

let initialized = false;
const clickRegistrations = new Set<NotificationClickRegistration>();

function attachNotificationClickListener(
  registration: NotificationClickRegistration,
): void {
  if (!initialized || !registration.active || registration.attached) return;
  try {
    OneSignal.Notifications.addEventListener("click", registration.listener);
    registration.attached = true;
  } catch {
    // Listener failures never block application startup.
  }
}

export function initOneSignal(consent: NotificationConsentState): boolean {
  const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId || initialized) return initialized;

  try {
    OneSignal.setConsentRequired(true);
    OneSignal.initialize(appId);
    initialized = true;
    for (const registration of clickRegistrations) {
      attachNotificationClickListener(registration);
    }
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

export function addNotificationClickListener(
  onJob: (jobId: string) => void,
): () => void {
  const registration: NotificationClickRegistration = {
    active: true,
    attached: false,
    listener: (event) => {
      const payload = parseNotificationClickPayload(
        event.notification?.additionalData,
      );
      if (payload) onJob(payload.jobId);
    },
  };
  clickRegistrations.add(registration);
  attachNotificationClickListener(registration);

  return () => {
    if (!registration.active) return;
    registration.active = false;
    clickRegistrations.delete(registration);
    if (!registration.attached) return;
    try {
      OneSignal.Notifications.removeEventListener(
        "click",
        registration.listener,
      );
    } catch {
      // Listener cleanup failure must not affect app navigation.
    }
  };
}

export function resetOneSignalClientForTests(): void {
  initialized = false;
  clickRegistrations.clear();
}
