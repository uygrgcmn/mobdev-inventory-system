import { MD3LightTheme, MD3DarkTheme, configureFonts } from "react-native-paper";

// Modern Industrial Palette
const Colors = {
    // Brand
    slateBlue: "#1E293B",  // Primary
    indigo: "#6366F1",     // Secondary / Accents

    // Backgrounds
    coolGray: "#F3F4F6",   // App Background
    surfaceWhite: "#FFFFFF",

    // Semantic
    emerald: "#10B981",    // Success / High Stock
    amber: "#F59E0B",      // Warning / Med Stock
    rose: "#F43F5E",       // Danger / Low Stock

    // Text
    darkText: "#1F2937",
    mutedText: "#64748B",
};

// Font Config (using System fonts for now, but configured for Inter-like feel if added later)
const fontConfig = {
    fontFamily: 'System',
};

export const AppLightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: Colors.slateBlue,
        onPrimary: "#FFFFFF",
        primaryContainer: "#E0E7FF",
        onPrimaryContainer: "#1E1B4B",

        secondary: Colors.indigo,
        onSecondary: "#FFFFFF",
        secondaryContainer: "#EEF2FF",
        onSecondaryContainer: "#312E81",

        background: Colors.coolGray,
        surface: Colors.surfaceWhite,
        surfaceVariant: "#E2E8F0",
        onSurface: Colors.darkText,
        onSurfaceVariant: Colors.mutedText,

        error: Colors.rose,

        // Custom extensions (typed as any for now to bypass TS strictness on MD3Colors)
        success: Colors.emerald,
        warning: Colors.amber,
        cardShadow: "rgba(30, 41, 59, 0.08)",
    },
};

export const AppDarkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: "#94A3B8", // Lighter slate for dark mode
        onPrimary: "#0F172A",
        primaryContainer: "#1E293B",
        onPrimaryContainer: "#E2E8F0",

        secondary: "#818CF8",
        onSecondary: "#1E1B4B",

        background: "#0F172A", // Very dark slate
        surface: "#1E293B",
        onSurface: "#F1F5F9",
        onSurfaceVariant: "#94A3B8",

        error: "#FB7185",

        success: "#34D399",
        warning: "#FBBF24",
        cardShadow: "rgba(0,0,0,0.4)",
    },
};
