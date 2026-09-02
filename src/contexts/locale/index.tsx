import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  isSupportedLocale,
  type SupportedLocale,
} from "@openingshq/core";
import { getLocales } from "expo-localization";
import {
  useCallback,
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { messages } from "@/i18n/messages";
import { resolveLocale } from "@/i18n/resolve-locale";
import type { FoundationMessages } from "@/i18n/types";

interface LocaleContextValue {
  hydrated: boolean;
  locale: SupportedLocale;
  messages: FoundationMessages;
  setLocale: (locale: SupportedLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);
const LOCALE_PREFERENCE_KEY = "openings:locale-preference";

export function LocaleProvider({ children }: PropsWithChildren): React.ReactNode {
  const deviceLocale = useMemo(
    () => resolveLocale(getLocales().map(({ languageTag }) => languageTag)),
    [],
  );
  const [locale, setLocaleState] = useState<SupportedLocale>(deviceLocale);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    void AsyncStorage.getItem(LOCALE_PREFERENCE_KEY)
      .then((storedLocale) => {
        if (active && storedLocale && isSupportedLocale(storedLocale)) {
          setLocaleState(storedLocale);
        }
      })
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const setLocale = useCallback((nextLocale: SupportedLocale) => {
    setLocaleState(nextLocale);
    void AsyncStorage.setItem(LOCALE_PREFERENCE_KEY, nextLocale);
  }, []);

  const value = useMemo(
    () => ({ hydrated, locale, messages: messages[locale], setLocale }),
    [hydrated, locale, setLocale],
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
