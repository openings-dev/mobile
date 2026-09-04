import { Mixpanel } from "mixpanel-react-native";

import { setProductEventHandler } from "./product-events";

let client: Mixpanel | null = null;
let loading: Promise<boolean> | null = null;

export async function enableAnalytics(): Promise<boolean> {
  const token = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
  if (!token) return false;
  if (client) return true;
  if (loading) return loading;

  loading = (async () => {
    try {
      const instance = new Mixpanel(token, false, true);
      instance.setUseIpAddressForGeolocation(false);
      await instance.init(true, undefined,
        process.env.EXPO_PUBLIC_MIXPANEL_API_HOST ?? "https://api.mixpanel.com");
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

export function disableAnalytics(): void {
  const instance = client;
  client = null;
  loading = null;
  setProductEventHandler(null);
  if (!instance) return;
  try { instance.optOutTracking(); } catch { /* analytics remains disabled */ }
  try { instance.reset(); } catch { /* local identity is best-effort */ }
}

export function resetMixpanelClientForTests(): void {
  client = null;
  loading = null;
  setProductEventHandler(null);
}
