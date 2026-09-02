import Feather from "@expo/vector-icons/Feather";
import type { SupportedLocale } from "@openingshq/core";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocale } from "@/contexts/locale";
import {
  useAppTheme,
  type ThemePreference,
} from "@/contexts/theme";
import { BrandWordmark } from "@/components/brand-wordmark";
import {
  PreferenceSheet,
  type PreferenceOption,
} from "@/components/preference-sheet";

const LOCALE_OPTIONS = [
  { label: "English", value: "en" },
  { label: "Português (Brasil)", value: "pt-BR" },
  { label: "Español", value: "es" },
  { label: "Italiano", value: "it" },
  { label: "Français", value: "fr" },
  { label: "Deutsch", value: "de" },
] as const satisfies readonly PreferenceOption<SupportedLocale>[];

const LOCALE_CODES: Record<SupportedLocale, string> = {
  de: "DE",
  en: "EN",
  es: "ES",
  fr: "FR",
  it: "IT",
  "pt-BR": "PT",
};

export function AppHeader(): React.ReactNode {
  const router = useRouter();
  const {
    locale,
    messages,
    setLocale,
  } = useLocale();
  const {
    name,
    preference,
    setPreference,
    theme,
  } = useAppTheme();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const themeOptions: readonly PreferenceOption<ThemePreference>[] = [
    { label: messages.header.system, value: "system" },
    { label: messages.header.light, value: "light" },
    { label: messages.header.dark, value: "dark" },
  ];

  return (
    <>
      <SafeAreaView className="bg-paper" edges={["top", "left", "right"]}>
        <View className="h-16 flex-row items-center justify-between gap-3 border-b border-line px-4">
          <Pressable
            accessibilityLabel={messages.header.brandLabel}
            accessibilityRole="button"
            className="min-h-11 min-w-44 justify-center rounded-control"
            hitSlop={4}
            onPress={() => router.replace("/jobs")}
          >
            <BrandWordmark />
          </Pressable>
          <View className="flex-row items-center gap-1">
            <Pressable
              accessibilityLabel={messages.localeLabel}
              accessibilityRole="button"
              className="h-11 min-w-12 flex-row items-center justify-center gap-1 rounded-control px-2"
              onPress={() => setLanguageOpen(true)}
            >
              <Feather
                name="globe"
                size={17}
                color={theme.colors["muted-foreground"]}
              />
              <Text className="font-body text-metadata font-semibold text-foreground">
                {LOCALE_CODES[locale]}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel={messages.header.appearanceLabel}
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-control"
              onPress={() => setAppearanceOpen(true)}
            >
              <Feather
                name={name === "dark" ? "moon" : "sun"}
                size={18}
                color={theme.colors["muted-foreground"]}
              />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
      <PreferenceSheet
        closeLabel={messages.common.close}
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
      <PreferenceSheet
        closeLabel={messages.common.close}
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
