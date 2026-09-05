import "../../../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

import { VersioningScreen } from "@/app/versioning";
import { AppErrorBoundary } from "@/components/app-error-boundary";
import { AnalyticsConsentBanner } from "@/components/analytics-consent-banner";
import { NotificationConsentPrompt } from "@/components/notification-consent-prompt";
import { OptionalUpdateBanner } from "@/components/optional-update-banner";
import { CandidateStateProvider } from "@/contexts/candidate-state";
import { LocaleProvider, useLocale } from "@/contexts/locale";
import { OpeningsCatalogProvider } from "@/contexts/openings-catalog";
import { ThemeProvider, useAppTheme } from "@/contexts/theme";
import { VersioningProvider, useVersioning } from "@/contexts/versioning";
import { startNotifications } from "@/services/notifications";
import { startTelemetry } from "@/services/telemetry";

startTelemetry();
void startNotifications();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function RootContent(): React.ReactNode {
  const { messages } = useLocale();
  const { name } = useAppTheme();
  const { mandatoryUpdate, status } = useVersioning();

  if (status === "loading") {
    return <View className="flex-1 bg-canvas" />;
  }

  if (mandatoryUpdate) return <VersioningScreen />;

  return (
    <AppErrorBoundary
      fallback={{
        message: messages.errorMessage,
        retry: messages.retry,
        title: messages.errorTitle,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <CandidateStateProvider>
          <OpeningsCatalogProvider>
            <StatusBar style={name === "dark" ? "light" : "dark"} />
            <Stack screenOptions={{ headerShown: false }} />
            <NotificationConsentPrompt />
            <AnalyticsConsentBanner />
            <OptionalUpdateBanner />
          </OpeningsCatalogProvider>
        </CandidateStateProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default function RootLayout(): React.ReactNode {
  return (
    <LocaleProvider>
      <ThemeProvider>
        <VersioningProvider>
          <RootContent />
        </VersioningProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}
