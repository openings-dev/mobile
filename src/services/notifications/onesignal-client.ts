import { OneSignal } from "react-native-onesignal";

import type { NotificationConsentState } from "./consent";

let initialized = false;

export function initOneSignal(consent: NotificationConsentState): boolean {
  const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId || initialized) return initialized;

  try {
    OneSignal.setConsentRequired(true);
    OneSignal.initialize(appId);
    initialized = true;
    if (consent === "granted") OneSignal.setConsentGiven(true);
    return true;
  } catch {
    return false;
  }
}

export async function grantOneSignalConsentAndRequestPermission(): Promise<boolean> {
  if (!initialized) return false;
  try {
    OneSignal.setConsentGiven(true);
    return await OneSignal.Notifications.requestPermission(false);
  } catch {
    return false;
  }
}

export function denyOneSignalConsent(): void {
  if (!initialized) return;
  try {
    OneSignal.setConsentGiven(false);
  } catch {
    // Notification failures never block the application.
  }
}

export function resetOneSignalClientForTests(): void {
  initialized = false;
}
