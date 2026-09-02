import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";

import { AppHeader } from "@/components/app-header";
import { useLocale } from "@/contexts/locale";
import { useAppTheme } from "@/contexts/theme";

export default function TabsLayout(): React.ReactNode {
  const { messages } = useLocale();
  const { theme } = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        header: () => <AppHeader />,
        headerShown: true,
        tabBarActiveTintColor: theme.colors["primary-deep"],
        tabBarInactiveTintColor: theme.colors["muted-foreground"],
        tabBarStyle: {
          backgroundColor: theme.colors.paper,
          borderTopColor: theme.colors.line,
        },
      }}
    >
      <Tabs.Screen name="jobs" options={{ title: messages.jobs.title, tabBarIcon: ({ color, size }) => <Feather name="briefcase" color={color} size={size} /> }} />
      <Tabs.Screen name="communities" options={{ title: messages.communities.title, tabBarIcon: ({ color, size }) => <Feather name="users" color={color} size={size} /> }} />
      <Tabs.Screen name="authors" options={{ title: messages.authors.title, tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} /> }} />
    </Tabs>
  );
}
