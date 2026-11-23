import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useLocale } from "@/contexts/locale";
import {
  readAnalyticsConsent,
  subscribeAnalyticsConsent,
  writeAnalyticsConsent,
  type AnalyticsConsentState,
} from "@/services/telemetry/consent";
import { disableAnalytics, enableAnalytics } from "@/services/telemetry/mixpanel-client";

export function AnalyticsPreference(): React.ReactNode {
  const { messages } = useLocale();
  const [consent, setConsent] = useState<AnalyticsConsentState | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryDenial, setRetryDenial] = useState(false);

  useEffect(() => {
    let active = true;
    void readAnalyticsConsent().then((state) => {
      if (active) setConsent(state);
    });
    const unsubscribe = subscribeAnalyticsConsent(setConsent);
    return () => { active = false; unsubscribe(); };
  }, []);

  const granted = consent === "granted";
  const disabled = pending || consent === null;
  const changePreference = async (): Promise<void> => {
    if (disabled) return;
    setPending(true);
    setFailed(false);
    try {
      const next = granted || retryDenial ? "denied" : "granted";
      if (next === "denied") {
        disableAnalytics();
        setConsent("denied");
      }
      if (!await writeAnalyticsConsent(next)) {
        setFailed(true);
        setRetryDenial(next === "denied");
        return;
      }
      setRetryDenial(false);
      if (next === "granted") await enableAnalytics();
    } finally {
      setPending(false);
    }
  };

  const copy = messages.analyticsConsent;
  return (
    <View className="gap-2">
      <Pressable
        accessibilityLabel={copy.preferenceTitle}
        accessibilityRole="switch"
        accessibilityState={{ checked: granted, disabled }}
        className="min-h-11 gap-1 rounded-control border border-line bg-paper px-3 py-3 disabled:opacity-50"
        disabled={disabled}
        onPress={() => void changePreference()}
      >
        <Text className="font-body text-label font-semibold text-foreground">{copy.preferenceTitle}</Text>
        <Text className="font-body text-metadata text-muted-foreground">{retryDenial ? copy.retryDenial : granted ? copy.disable : copy.accept}</Text>
      </Pressable>
      {failed ? <Text accessibilityRole="alert" className="font-body text-metadata text-foreground">{copy.saveError}</Text> : null}
    </View>
  );
}
