import { Tabs } from "expo-router";
import { BriefcaseBusiness, UserRound, UsersRound } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/components/app-header";
import { useLocale } from "@/contexts/locale";
import { useAppTheme } from "@/contexts/theme";

export default function TabsLayout(): React.ReactNode {
  const { messages } = useLocale();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        header: () => <AppHeader />,
        headerShown: true,
        sceneStyle: {
          backgroundColor: theme.colors.canvas,
        },
        tabBarActiveTintColor: theme.colors["primary-deep"],
        tabBarAllowFontScaling: true,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: theme.colors["muted-foreground"],
        tabBarLabelStyle: {
          fontFamily: "Figtree",
          fontSize: 11,
          fontWeight: "500",
        },
        tabBarStyle: {
          backgroundColor: theme.colors.paper,
          borderTopColor: theme.colors.line,
          height: 64 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen name="jobs" options={{ title: messages.jobs.title, tabBarIcon: ({ color, size }) => <BriefcaseBusiness accessibilityElementsHidden color={color} size={size} strokeWidth={1.8} /> }} />
      <Tabs.Screen name="communities" options={{ title: messages.communities.title, tabBarIcon: ({ color, size }) => <UsersRound accessibilityElementsHidden color={color} size={size} strokeWidth={1.8} /> }} />
      <Tabs.Screen name="authors" options={{ title: messages.authors.title, tabBarIcon: ({ color, size }) => <UserRound accessibilityElementsHidden color={color} size={size} strokeWidth={1.8} /> }} />
    </Tabs>
  );
}
