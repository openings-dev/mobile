import { Stack } from "expo-router";

import { AppHeader } from "@/components/app-header";
import { useLocale } from "@/contexts/locale";
import { useAppTheme } from "@/contexts/theme";

export default function AppShellLayout(): React.ReactNode {
  const { messages } = useLocale();
  const { theme } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: theme.colors.canvas,
        },
        header: () => <AppHeader />,
        headerShown: true,
      }}
    >
      <Stack.Screen name="jobs" options={{ title: messages.jobs.title }} />
      <Stack.Screen name="communities" options={{ title: messages.communities.title }} />
      <Stack.Screen name="authors" options={{ title: messages.authors.title }} />
    </Stack>
  );
}
