import { OPENINGS_FOUNDATION_VERSION } from "@openingshq/core";
import { colorPrimitives } from "@openingshq/design-tokens";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { useLocale } from "@/contexts/locale";
import { useAppTheme } from "@/contexts/theme";

export function HomeScreen(): React.ReactNode {
  const { locale, messages } = useLocale();
  const { name } = useAppTheme();

  return (
    <SafeAreaView
      className="flex-1 bg-canvas"
      edges={["top", "right", "bottom", "left"]}
      testID="home-screen"
    >
      <StatusBar style={name === "dark" ? "light" : "dark"} />
      <View className="flex-1 justify-between px-6 py-8">
        <View className="flex-row items-center justify-between border-b border-line pb-16">
          <Text className="font-display text-card-title font-semibold text-foreground">
            openings.dev
          </Text>
          <Text
            accessibilityLabel={`${messages.localeLabel}: ${locale}`}
            className="font-body text-metadata font-medium text-muted-foreground"
          >
            {locale}
          </Text>
        </View>

        <View className="gap-6">
          <View className="self-start rounded-pill bg-primary-soft px-16 py-2">
            <Text className="font-body text-label font-semibold text-primary-deep">
              {messages.eyebrow}
            </Text>
          </View>

          <View className="gap-16">
            <Text className="font-display text-section-title font-semibold text-foreground">
              {messages.title}
            </Text>
            <Text className="max-w-xl font-body text-product-body text-muted-foreground">
              {messages.description}
            </Text>
          </View>

          <View className="gap-2 rounded-card border border-line bg-paper p-5">
            <View className="flex-row items-center gap-3">
              <View className="h-3 w-3 rounded-pill bg-primary" />
              <Text className="font-body text-product-body font-semibold text-foreground">
                {messages.status}
              </Text>
            </View>
            <Text className="font-mono text-metadata text-muted-foreground">
              Core {OPENINGS_FOUNDATION_VERSION} · Tokens{" "}
              {colorPrimitives.brandMint}
            </Text>
          </View>
        </View>

        <Text className="font-body text-metadata text-subtle-foreground">
          dev.openings.mobile
        </Text>
      </View>
    </SafeAreaView>
  );
}
