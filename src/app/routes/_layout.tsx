import "../../../global.css";

import { Stack } from "expo-router";

import { AppErrorBoundary } from "@/components/app-error-boundary";
import { LocaleProvider, useLocale } from "@/contexts/locale";
import { ThemeProvider } from "@/contexts/theme";

function RootContent(): React.ReactNode {
  const { messages } = useLocale();

  return (
    <ThemeProvider>
      <AppErrorBoundary
        fallback={{
          message: messages.errorMessage,
          retry: messages.retry,
          title: messages.errorTitle,
        }}
      >
        <Stack screenOptions={{ headerShown: false }} />
      </AppErrorBoundary>
    </ThemeProvider>
  );
}

export default function RootLayout(): React.ReactNode {
  return (
    <LocaleProvider>
      <RootContent />
    </LocaleProvider>
  );
}
