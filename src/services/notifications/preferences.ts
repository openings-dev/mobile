import { writeNotificationConsent } from "./consent";

export async function withdrawNotifications(): Promise<boolean> {
  const persisted = await writeNotificationConsent("denied");
  if (!persisted) return false;
  try {
    const { denyOneSignalConsent } = await import("./onesignal-client");
    denyOneSignalConsent();
  } catch {
    // The local withdrawal remains authoritative if the optional SDK is unavailable.
  }
  return true;
}
