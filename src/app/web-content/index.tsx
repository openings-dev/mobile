import {
  ManagedWebView,
  type ManagedWebViewErrorContext,
  type ManagedWebViewLoadingContext,
} from "@trebla/managed-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocale } from "@/contexts/locale";
import { useAppTheme } from "@/contexts/theme";
import { openHttpsUrl } from "@/services/external-actions";

import { getLegalContent, parseLegalContentKind } from "./legal-content";

const OPENINGS_ORIGINS = ["https://openings.dev"] as const;
const WEB_VIEW_STYLE = { flex: 1 } as const;

function OpeningsLoading({
  appearance,
  labels,
}: ManagedWebViewLoadingContext): React.ReactNode {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-canvas">
      <ActivityIndicator color={appearance.indicatorColor} />
      <Text className="font-body text-product-body text-muted-foreground">
        {labels.loading}
      </Text>
    </View>
  );
}

function OpeningsFailure({
  labels,
  openExternal,
  retry,
}: ManagedWebViewErrorContext): React.ReactNode {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-canvas px-16">
      <Text
        accessibilityRole="header"
        className="text-center font-display text-product-title text-foreground"
      >
        {labels.errorTitle}
      </Text>
      <Text className="text-center font-body text-product-body text-muted-foreground">
        {labels.errorDescription}
      </Text>
      {retry ? (
        <Pressable
          accessibilityRole="button"
          className="min-h-touch justify-center rounded-pill bg-primary px-16"
          onPress={retry}
        >
          <Text className="font-body font-semibold text-primary-foreground">
            {labels.retry}
          </Text>
        </Pressable>
      ) : null}
      {openExternal ? (
        <Pressable
          accessibilityRole="button"
          className="min-h-touch justify-center rounded-pill border border-line px-16"
          onPress={() => void openExternal()}
        >
          <Text className="font-body font-semibold text-foreground">
            {labels.openExternal}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function WebContentScreen(): React.ReactNode {
  const params = useLocalSearchParams<{ kind?: string | string[] }>();
  const router = useRouter();
  const { messages } = useLocale();
  const { theme } = useAppTheme();
  const kind = parseLegalContentKind(params.kind);

  useEffect(() => {
    if (!kind) router.back();
  }, [kind, router]);

  if (!kind) return null;

  const document = getLegalContent(kind);

  return (
    <SafeAreaView
      className="flex-1 bg-canvas"
      edges={["top", "bottom", "left", "right"]}
      testID="web-content-safe-area"
    >
      <View className="min-h-[60px] flex-row items-center gap-3 border-b border-line px-16">
        <Pressable
          accessibilityLabel={messages.common.close}
          accessibilityRole="button"
          className="h-touch w-touch items-center justify-center"
          onPress={() => router.back()}
        >
          <ArrowLeft color={theme.colors.foreground} size={20} strokeWidth={1.8} />
        </Pressable>
        <Text
          className="flex-1 font-display text-card-title font-semibold text-foreground"
          numberOfLines={2}
        >
          {messages.legal[kind]}
        </Text>
      </View>
      <ManagedWebView
        allowedOrigins={OPENINGS_ORIGINS}
        allowedPaths={[document.path]}
        appearance={{
          actionBackgroundColor: theme.colors.primary,
          actionTextColor: theme.colors["primary-foreground"],
          backgroundColor: theme.colors.canvas,
          indicatorColor: theme.colors.foreground,
          mutedTextColor: theme.colors["muted-foreground"],
          textColor: theme.colors.foreground,
        }}
        challengeDetection
        labels={{
          errorDescription: messages.legal.errorDescription,
          errorTitle: messages.legal.errorTitle,
          loading: messages.legal.loading,
          openExternal: messages.legal.openBrowser,
          retry: messages.legal.retry,
        }}
        onOpenExternal={openHttpsUrl}
        readiness={{ type: "load" }}
        renderError={OpeningsFailure}
        renderLoading={OpeningsLoading}
        timeoutMs={10_000}
        uri={document.uri}
        webViewStyle={WEB_VIEW_STYLE}
      />
    </SafeAreaView>
  );
}
