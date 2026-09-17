import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLocale } from "@/contexts/locale";
import { useVersioning } from "@/contexts/versioning";

export function OptionalUpdateBanner(): React.ReactNode {
  const { messages } = useLocale();
  const insets = useSafeAreaInsets();
  const {
    dismissOptionalUpdate,
    mandatoryUpdate,
    optionalStoreVersion,
    startOptionalUpdate,
  } = useVersioning();
  const [pending, setPending] = useState(false);

  if (mandatoryUpdate || optionalStoreVersion === null) return null;

  const run = async (action: () => Promise<unknown>): Promise<void> => {
    if (pending) return;
    setPending(true);
    try {
      await action();
    } finally {
      setPending(false);
    }
  };

  const copy = messages.versioning;
  return (
    <View
      className="absolute inset-x-0 bottom-0 z-40 border-t border-line bg-paper px-5 pt-5"
      style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      testID="optional-update-banner"
    >
      <Text className="font-display text-product-title font-semibold text-foreground">
        {copy.optionalTitle}
      </Text>
      <Text className="mt-2 font-body text-product-body text-muted-foreground">
        {copy.optionalDescription}
      </Text>
      <View className="mt-16 flex-row gap-3">
        <Pressable
          accessibilityLabel={copy.updateAction}
          accessibilityRole="button"
          className="min-h-touch flex-1 items-center justify-center rounded-control bg-primary px-16 disabled:opacity-50"
          disabled={pending}
          onPress={() => void run(startOptionalUpdate)}
          testID="optional-update-action"
        >
          {pending ? <ActivityIndicator /> : (
            <Text className="font-body text-product-body font-semibold text-primary-foreground">
              {copy.updateAction}
            </Text>
          )}
        </Pressable>
        <Pressable
          accessibilityLabel={copy.dismiss}
          accessibilityRole="button"
          className="min-h-touch flex-1 items-center justify-center rounded-control border border-line bg-canvas px-16 disabled:opacity-50"
          disabled={pending}
          onPress={() => void run(dismissOptionalUpdate)}
          testID="optional-update-dismiss"
        >
          <Text className="font-body text-product-body font-semibold text-foreground">
            {copy.dismiss}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
