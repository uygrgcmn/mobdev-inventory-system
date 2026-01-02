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

const ThemeContext = createContext<ThemeCtx>({ mode: "light", toggle: () => {} });

const STORAGE_KEY = "@mobdev_theme";

const lightTheme = {
  ...PaperLight,
  colors: {
    ...PaperLight.colors,
    primary: "#3B82F6", // Tailwind blue-500
    secondary: "#22C55E", // green-500
  },
};

const darkTheme = {
  ...PaperDark,
  colors: {
    ...PaperDark.colors,
    primary: "#60A5FA", // blue-400
    secondary: "#4ADE80", // green-400
  },
};

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
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
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
