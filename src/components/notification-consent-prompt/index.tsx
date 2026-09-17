import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLocale } from "@/contexts/locale";
import { acceptNotifications, declineNotifications } from "@/services/notifications";
import {
  readNotificationConsent,
  subscribeNotificationConsent,
  type NotificationConsentState,
} from "@/services/notifications/consent";
import {
  readAnalyticsConsent,
  subscribeAnalyticsConsent,
  type AnalyticsConsentState,
} from "@/services/telemetry/consent";

export function NotificationConsentPrompt(): React.ReactNode {
  const { messages } = useLocale();
  const insets = useSafeAreaInsets();
  const [consent, setConsent] = useState<NotificationConsentState | null>(null);
  const [analyticsConsent, setAnalyticsConsent] = useState<AnalyticsConsentState | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    void readNotificationConsent().then((state) => {
      if (active) setConsent(state);
    });
    const unsubscribe = subscribeNotificationConsent(setConsent);
    void readAnalyticsConsent().then((state) => {
      if (active) setAnalyticsConsent(state);
    });
    const unsubscribeAnalytics = subscribeAnalyticsConsent(setAnalyticsConsent);
    return () => {
      active = false;
      unsubscribe();
      unsubscribeAnalytics();
    };
  }, []);

  if (consent !== "undecided" || analyticsConsent === null || analyticsConsent === "undecided") return null;

  const decide = async (choice: "accept" | "decline"): Promise<void> => {
    if (pending) return;
    setPending(true);
    const succeeded = choice === "accept"
      ? await acceptNotifications()
      : await declineNotifications();
    if (!succeeded) setPending(false);
  };

  const copy = messages.notificationConsent;
  return (
    <View
      className="absolute inset-x-0 bottom-0 z-50 border-t border-line bg-paper px-5 pt-5"
      style={{ paddingBottom: Math.max(insets.bottom, 20) }}
    >
      <Text className="font-display text-product-title font-semibold text-foreground">{copy.title}</Text>
      <Text className="mt-2 font-body text-product-body text-muted-foreground">{copy.purpose}</Text>
      <View className="mt-16 flex-row gap-3">
        <Pressable accessibilityRole="button" accessibilityLabel={copy.accept} className="min-h-touch flex-1 items-center justify-center rounded-control bg-primary px-16 disabled:opacity-50" disabled={pending} onPress={() => void decide("accept")}>
          <Text className="font-body text-product-body font-semibold text-primary-foreground">{copy.accept}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={copy.decline} className="min-h-touch flex-1 items-center justify-center rounded-control border border-line bg-canvas px-16 disabled:opacity-50" disabled={pending} onPress={() => void decide("decline")}>
          <Text className="font-body text-product-body font-semibold text-foreground">{copy.decline}</Text>
        </Pressable>
      </View>
    </View>
  );
}
