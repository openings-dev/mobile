import "../../../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppErrorBoundary } from "@/components/app-error-boundary";
import { AnalyticsConsentBanner } from "@/components/analytics-consent-banner";
import { NotificationConsentPrompt } from "@/components/notification-consent-prompt";
import { CandidateStateProvider } from "@/contexts/candidate-state";
import { LocaleProvider, useLocale } from "@/contexts/locale";
import { OpeningsCatalogProvider } from "@/contexts/openings-catalog";
import { ThemeProvider, useAppTheme } from "@/contexts/theme";
import { startTelemetry } from "@/services/telemetry";
import { startNotifications } from "@/services/notifications";

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
        <RootContent />
      </ThemeProvider>
    </LocaleProvider>
  );
}
