import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "openings:optional-update-dismissal";
const STORAGE_VERSION = 1;

function validStoreVersion(value: string): boolean {
  return value.trim().length > 0;
}

export async function isOptionalUpdateDismissed(
  storeVersion: string,
): Promise<boolean> {
  if (!validStoreVersion(storeVersion)) return false;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const value = JSON.parse(raw) as Record<string, unknown>;
    return (
      value.version === STORAGE_VERSION &&
      value.storeVersion === storeVersion
    );
  } catch {
    return false;
  }
}

export async function dismissOptionalUpdate(
  storeVersion: string,
): Promise<boolean> {
  if (!validStoreVersion(storeVersion)) return false;

  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        dismissedAt: new Date().toISOString(),
        storeVersion,
        version: STORAGE_VERSION,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
