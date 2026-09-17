import { useRouter } from "expo-router";
import { Menu } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppDrawer } from "@/components/app-drawer";
import { BrandWordmark } from "@/components/brand-wordmark";
import { useLocale } from "@/contexts/locale";
import { useAppTheme } from "@/contexts/theme";

export function AppHeader(): React.ReactNode {
  const router = useRouter();
  const { messages } = useLocale();
  const { theme } = useAppTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <SafeAreaView className="bg-paper" edges={["top", "left", "right"]}>
        <View className="h-[72px] flex-row items-center justify-between gap-3 border-b border-line px-16">
          <Pressable
            accessibilityLabel={messages.header.brandLabel}
            accessibilityRole="button"
            className="min-h-11 min-w-44 justify-center rounded-control"
            hitSlop={4}
            onPress={() => router.replace("/jobs")}
          >
            <BrandWordmark height={32} width={176} />
          </Pressable>
          <Pressable
            accessibilityLabel={messages.header.menu}
            accessibilityRole="button"
            accessibilityState={{ expanded: drawerOpen }}
            className="h-11 w-11 items-center justify-center rounded-control border border-line bg-paper"
            hitSlop={4}
            onPress={() => setDrawerOpen(true)}
          >
            <Menu color={theme.colors.foreground} size={20} strokeWidth={1.8} />
          </Pressable>
        </View>
      </SafeAreaView>
      <AppDrawer onClose={() => setDrawerOpen(false)} visible={drawerOpen} />
    </>
  );
}
