import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useCallback,
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme, View } from "react-native";
import { vars } from "nativewind";

import {
  darkNativeVariables,
  darkRuntimeTheme,
  lightNativeVariables,
  lightRuntimeTheme,
} from "@/theme/nativewind";

type ThemeName = "dark" | "light";
export type ThemePreference = "dark" | "light" | "system";

interface ThemeContextValue {
  hydrated: boolean;
  name: ThemeName;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  theme: typeof darkRuntimeTheme | typeof lightRuntimeTheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_PREFERENCE_KEY = "openings:theme-preference";

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "dark" || value === "light" || value === "system";
}

export function ThemeProvider({ children }: PropsWithChildren): React.ReactNode {
  const systemName: ThemeName = useColorScheme() === "dark" ? "dark" : "light";
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [hydrated, setHydrated] = useState(false);
  const name: ThemeName = preference === "system" ? systemName : preference;
  const theme = name === "dark" ? darkRuntimeTheme : lightRuntimeTheme;
  const nativeVariables =
    name === "dark" ? darkNativeVariables : lightNativeVariables;

  useEffect(() => {
    let active = true;

    void AsyncStorage.getItem(THEME_PREFERENCE_KEY)
      .then((storedPreference) => {
        if (active && isThemePreference(storedPreference)) {
          setPreferenceState(storedPreference);
        }
      })
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    void AsyncStorage.setItem(THEME_PREFERENCE_KEY, nextPreference);
  }, []);
  const value = useMemo(
    () => ({ hydrated, name, preference, setPreference, theme }),
    [hydrated, name, preference, setPreference, theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View
        className={name === "dark" ? "dark flex-1" : "flex-1"}
        style={vars(nativeVariables)}
      >
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }

  return context;
}
