import { getCrashlytics, setCrashlyticsCollectionEnabled } from "@react-native-firebase/crashlytics";

export function initCrashlytics(): void {
  try {
    setCrashlyticsCollectionEnabled(getCrashlytics(), true).catch(() => {
      // No Firebase app is configured on this build; crash reporting stays off.
    });
  } catch {
    // getCrashlytics() itself can throw synchronously when no app is configured.
  }
}
