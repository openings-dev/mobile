import { Mixpanel } from "mixpanel-react-native";

import { setProductEventHandler } from "./product-events";

let client: Mixpanel | null = null;
let loading: Promise<boolean> | null = null;
let generation = 0;
let loadingGeneration = 0;

export async function enableAnalytics(): Promise<boolean> {
  const token = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
  if (!token) return false;
  if (client) return true;
  if (loading) {
    if (loadingGeneration === generation) return loading;
    const requestedGeneration = generation;
    return loading.then(() => requestedGeneration === generation ? enableAnalytics() : false);
  }
  const startedGeneration = generation;
  loadingGeneration = startedGeneration;

  loading = (async () => {
    try {
      const instance = new Mixpanel(token, false, true);
      instance.setUseIpAddressForGeolocation(false);
      await instance.init(true, undefined,
        process.env.EXPO_PUBLIC_MIXPANEL_API_HOST ?? "https://api.mixpanel.com");
      if (startedGeneration !== generation) {
        stopAnalyticsClient(instance);
        return false;
      }
      instance.optInTracking();
      client = instance;
      setProductEventHandler((name, properties) => instance.track(name, properties));
      return true;
    } catch {
      client = null;
      return false;
    } finally {
      loading = null;
    }
  })();
  return loading;
}

export function sendProductEvent(
  name: string,
  properties: Record<string, unknown>,
): void {
  client?.track(name, properties);
}

function stopAnalyticsClient(instance: Mixpanel): void {
  try { instance.optOutTracking(); } catch { /* analytics remains disabled */ }
  try { instance.reset(); } catch { /* local identity is best-effort */ }
}

export function disableAnalytics(): void {
  generation += 1;
  const instance = client;
  client = null;
  setProductEventHandler(null);
  if (!instance) return;
  stopAnalyticsClient(instance);
}

export function resetMixpanelClientForTests(): void {
  generation += 1;
  loading = null;
  client = null;
  setProductEventHandler(null);
}
