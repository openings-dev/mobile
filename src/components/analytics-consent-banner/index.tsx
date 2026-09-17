import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLocale } from "@/contexts/locale";
import {
  readAnalyticsConsent,
  subscribeAnalyticsConsent,
  writeAnalyticsConsent,
  type AnalyticsConsentState,
} from "@/services/telemetry/consent";
import { disableAnalytics, enableAnalytics } from "@/services/telemetry/mixpanel-client";

export function AnalyticsConsentBanner(): React.ReactNode {
  const { messages } = useLocale();
  const insets = useSafeAreaInsets();
  const [consent, setConsent] = useState<AnalyticsConsentState | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    void readAnalyticsConsent().then((state) => {
      if (!active) return;
      setConsent(state);
      if (state === "granted") void enableAnalytics();
    });
    const unsubscribe = subscribeAnalyticsConsent(setConsent);
    return () => { active = false; unsubscribe(); };
  }, []);

  if (consent !== "undecided") return null;

  const decide = async (state: "granted" | "denied"): Promise<void> => {
    if (pending) return;
    setPending(true);
    const persisted = await writeAnalyticsConsent(state);
    if (!persisted) { setPending(false); return; }
    if (state === "granted") await enableAnalytics();
    else disableAnalytics();
  };

  const copy = messages.analyticsConsent;
  return (
    <View className="absolute inset-x-0 bottom-0 z-50 border-t border-line bg-paper px-5 pt-5" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
      <Text className="font-display text-product-title font-semibold text-foreground">{copy.title}</Text>
      <Text className="mt-2 font-body text-product-body text-muted-foreground">{copy.purpose}</Text>
      <View className="mt-16 flex-row gap-3">
        <Pressable accessibilityRole="button" accessibilityLabel={copy.accept} className="min-h-touch flex-1 items-center justify-center rounded-control bg-primary px-16 disabled:opacity-50" disabled={pending} onPress={() => void decide("granted")}>
          <Text className="font-body text-product-body font-semibold text-primary-foreground">{copy.accept}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={copy.decline} className="min-h-touch flex-1 items-center justify-center rounded-control border border-line bg-canvas px-16 disabled:opacity-50" disabled={pending} onPress={() => void decide("denied")}>
          <Text className="font-body text-product-body font-semibold text-foreground">{copy.decline}</Text>
        </Pressable>
      </View>
    </View>
  );
}
