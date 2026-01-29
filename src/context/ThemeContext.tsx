// src/context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  MD3LightTheme as PaperLight,
  MD3DarkTheme as PaperDark,
  Provider as PaperProvider,
} from "react-native-paper";

type Mode = "light" | "dark";

type ThemeCtx = {
  mode: Mode;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeCtx>({ mode: "light", toggle: () => { } });

const STORAGE_KEY = "@mobdev_theme";

import { AppLightTheme, AppDarkTheme } from "../constants/theme";

const lightTheme = AppLightTheme;
const darkTheme = AppDarkTheme;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("light");
  const theme = useMemo(() => (mode === "dark" ? darkTheme : lightTheme), [mode]);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") setMode(saved);
    })();
  }, []);

  const toggle = async () => {
    setMode((prev) => {
      const next: Mode = prev === "light" ? "dark" : "light";
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => { });
      return next;
    });
  };

  const value = useMemo(() => ({ mode, toggle }), [mode]);

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
