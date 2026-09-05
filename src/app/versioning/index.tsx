import { useEffect, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandWordmark } from "@/components/brand-wordmark";
import { useLocale } from "@/contexts/locale";
import { useVersioning } from "@/contexts/versioning";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=dev.openings.mobile";

export function VersioningScreen(): React.ReactNode {
  const { messages } = useLocale();
  const { startImmediateUpdate } = useVersioning();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => subscription.remove();
  }, []);

  const update = async (): Promise<void> => {
    if (pending) return;
    setPending(true);
    try {
      const started = await startImmediateUpdate();
      if (!started) await Linking.openURL(PLAY_STORE_URL);
    } finally {
      setPending(false);
    }
  };

  const copy = messages.versioning;
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["top", "right", "bottom", "left"]}>
      <View className="flex-1 items-center justify-center px-6">
        <BrandWordmark />
        <Text className="mt-10 text-center font-display text-product-heading font-semibold text-foreground">
          {copy.title}
        </Text>
        <Text className="mt-3 max-w-prose text-center font-body text-product-body text-muted-foreground">
          {copy.description}
        </Text>
        <Pressable
          accessibilityLabel={copy.updateAction}
          accessibilityRole="button"
          className="mt-8 min-h-touch w-full items-center justify-center rounded-control bg-primary px-5 disabled:opacity-50"
          disabled={pending}
          onPress={() => void update()}
          testID="versioning-update"
        >
          {pending ? <ActivityIndicator /> : (
            <Text className="font-body text-product-body font-semibold text-primary-foreground">
              {copy.updateAction}
            </Text>
          )}
        </Pressable>
        <Pressable
          accessibilityLabel={copy.storeAction}
          accessibilityRole="link"
          className="mt-3 min-h-touch w-full items-center justify-center rounded-control border border-line bg-paper px-5"
          onPress={() => void Linking.openURL(PLAY_STORE_URL)}
          testID="versioning-open-store"
        >
          <Text className="font-body text-product-body font-semibold text-foreground">
            {copy.storeAction}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
