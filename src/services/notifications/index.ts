import {
  readNotificationConsent,
  writeNotificationConsent,
} from "./consent";
import {
  denyOneSignalConsent,
  grantOneSignalConsentAndRequestPermission,
  initOneSignal,
} from "./onesignal-client";

export async function startNotifications(): Promise<void> {
  const consent = await readNotificationConsent();
  initOneSignal(consent);
}

export async function acceptNotifications(): Promise<boolean> {
  const persisted = await writeNotificationConsent("granted");
  if (!persisted) return false;
  await grantOneSignalConsentAndRequestPermission();
  return true;
}

export async function declineNotifications(): Promise<boolean> {
  const persisted = await writeNotificationConsent("denied");
  if (!persisted) return false;
  denyOneSignalConsent();
  return true;
}
