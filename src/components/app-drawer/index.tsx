import type { SupportedLocale } from "@openingshq/core";
import { useRouter } from "expo-router";
import {
  BriefcaseBusiness,
  ChevronUp,
  Globe2,
  Moon,
  Sun,
  UserRound,
  UsersRound,
  X,
} from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandWordmark } from "@/components/brand-wordmark";
import { PreferencePopover, type PreferenceOption } from "@/components/preference-popover";
import { SupportCard } from "@/components/support-card";
import { useLocale } from "@/contexts/locale";
import { useAppTheme, type ThemePreference } from "@/contexts/theme";

const LOCALE_OPTIONS = [
  { label: "English", value: "en" },
  { label: "Português", value: "pt-BR" },
  { label: "Español", value: "es" },
  { label: "Italiano", value: "it" },
  { label: "Français", value: "fr" },
  { label: "Deutsch", value: "de" },
] as const satisfies readonly PreferenceOption<SupportedLocale>[];

const LOCALE_NAMES: Record<SupportedLocale, string> = {
  de: "Deutsch",
  en: "English",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  "pt-BR": "Português",
};

interface AppDrawerProps {
  onClose: () => void;
  visible: boolean;
}

export function AppDrawer({ onClose, visible }: AppDrawerProps): React.ReactNode {
  const router = useRouter();
  const { locale, messages, setLocale } = useLocale();
  const { name, preference, setPreference, theme } = useAppTheme();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const themeOptions: readonly PreferenceOption<ThemePreference>[] = [
    { label: messages.header.system, value: "system" },
    { label: messages.header.light, value: "light" },
    { label: messages.header.dark, value: "dark" },
  ];
  const navigationItems = [
    { href: "/jobs", icon: BriefcaseBusiness, label: messages.jobs.title },
    { href: "/communities", icon: UsersRound, label: messages.communities.title },
    { href: "/authors", icon: UserRound, label: messages.authors.title },
  ] as const;

  const close = () => {
    setLanguageOpen(false);
    setAppearanceOpen(false);
    onClose();
  };

  return (
    <>
      <Modal animationType="fade" onRequestClose={close} transparent visible={visible}>
        <Pressable className="flex-1 flex-row justify-end bg-overlay" onPress={close}>
          <Pressable
            accessibilityLabel={messages.header.menu}
            className="h-full w-[92%] max-w-[368px] border-l border-line bg-paper shadow-floating"
            onPress={(event) => event.stopPropagation()}
          >
            <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
              <View className="min-h-[72px] flex-row items-center justify-between border-b border-line px-4">
                <BrandWordmark height={32} width={176} />
                <Pressable
                  accessibilityLabel={messages.header.closeMenu}
                  accessibilityRole="button"
                  className="h-11 w-11 items-center justify-center rounded-control border border-line bg-paper"
                  onPress={close}
                >
                  <X color={theme.colors.foreground} size={20} strokeWidth={1.8} />
                </Pressable>
              </View>

              <ScrollView className="flex-1" contentContainerClassName="gap-1 p-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      className="min-h-11 flex-row items-center gap-3 rounded-control px-3"
                      key={item.href}
                      onPress={() => {
                        router.replace(item.href);
                        close();
                      }}
                    >
                      <Icon color={theme.colors["muted-foreground"]} size={18} strokeWidth={1.8} />
                      <Text className="font-body text-product-body font-medium text-foreground">
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View className="gap-3 border-t border-line bg-surface p-4">
                <SupportCard />
                <View className="flex-row gap-2">
                  <Pressable
                    accessibilityLabel={messages.header.appearanceLabel}
                    accessibilityRole="button"
                    className="h-11 w-11 items-center justify-center rounded-control border border-line bg-paper"
                    onPress={() => setAppearanceOpen(true)}
                  >
                    {name === "dark" ? (
                      <Moon color={theme.colors["muted-foreground"]} size={18} strokeWidth={1.8} />
                    ) : (
                      <Sun color={theme.colors["muted-foreground"]} size={18} strokeWidth={1.8} />
                    )}
                  </Pressable>
                  <Pressable
                    accessibilityLabel={messages.localeLabel}
                    accessibilityRole="button"
                    className="h-11 min-w-0 flex-1 flex-row items-center gap-2 rounded-control border border-primary/40 bg-primary-soft px-3"
                    onPress={() => setLanguageOpen(true)}
                  >
                    <Globe2 color={theme.colors["primary-deep"]} size={17} strokeWidth={1.8} />
                    <Text className="min-w-0 flex-1 font-body text-metadata font-medium text-foreground">
                      {LOCALE_NAMES[locale]}
                    </Text>
                    <ChevronUp color={theme.colors["muted-foreground"]} size={16} strokeWidth={1.6} />
                  </Pressable>
                </View>
              </View>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>

      <PreferencePopover
        onClose={() => setLanguageOpen(false)}
        onSelect={(nextLocale) => {
          setLocale(nextLocale);
          setLanguageOpen(false);
        }}
        options={LOCALE_OPTIONS}
        selectedValue={locale}
        title={messages.header.languageTitle}
        visible={languageOpen}
      />
      <PreferencePopover
        onClose={() => setAppearanceOpen(false)}
        onSelect={(nextPreference) => {
          setPreference(nextPreference);
          setAppearanceOpen(false);
        }}
        options={themeOptions}
        selectedValue={preference}
        title={messages.header.appearanceTitle}
        visible={appearanceOpen}
      />
    </>
  );
}
