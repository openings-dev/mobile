import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
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

interface ThemeContextValue {
  name: ThemeName;
  theme: typeof darkRuntimeTheme | typeof lightRuntimeTheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren): React.ReactNode {
  const name: ThemeName = useColorScheme() === "dark" ? "dark" : "light";
  const theme = name === "dark" ? darkRuntimeTheme : lightRuntimeTheme;
  const nativeVariables =
    name === "dark" ? darkNativeVariables : lightNativeVariables;
  const value = useMemo(() => ({ name, theme }), [name, theme]);

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
