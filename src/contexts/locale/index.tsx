import type { SupportedLocale } from "@openingshq/core";
import { getLocales } from "expo-localization";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from "react";

import { messages } from "@/i18n/messages";
import { resolveLocale } from "@/i18n/resolve-locale";
import type { FoundationMessages } from "@/i18n/types";

interface LocaleContextValue {
  locale: SupportedLocale;
  messages: FoundationMessages;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: PropsWithChildren): React.ReactNode {
  const locale = resolveLocale(getLocales().map(({ languageTag }) => languageTag));
  const value = useMemo(
    () => ({ locale, messages: messages[locale] }),
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}
