// App.tsx
import * as React from "react";
import { View } from "react-native";
import { ActivityIndicator, MD2Colors } from "react-native-paper";

import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { initDB } from "./src/db/db";
import { ensureSchema } from "./src/db/migrations";
import { ThemeProvider } from "./src/context/ThemeContext";

// Sadece Auth yüklenmesini beklemek için küçük bir kapı
function Gate() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator animating size="large" color={MD2Colors.blue500} />
      </View>
    );
  }
  return <AppNavigator />;
}

export default function App() {
  const [dbReady, setDbReady] = React.useState(false);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        console.log("[BOOT] initDB start");
        await initDB();

        console.log("[BOOT] ensureSchema start");
        await ensureSchema();
        console.log("[BOOT] ensureSchema done");
      } catch (e: any) {
        console.error("[BOOT][ERROR]", e?.message || e);
      } finally {
        if (alive) setDbReady(true);
      }
    })();

    // 15 sn watchdog: beklenmedik takılmalarda UI’yı aç
    const watchdog = setTimeout(() => {
      if (!dbReady) {
        console.warn("[BOOT] Watchdog triggered → forcing dbReady=true");
        setDbReady(true);
      }
    }, 15000);

    return () => {
      alive = false;
      clearTimeout(watchdog);
    };
  }, [dbReady]);

  if (!dbReady) {
    // DB/migration beklenirken loader
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator animating size="large" color={MD2Colors.blue500} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <Gate />
      </ThemeProvider>
    </AuthProvider>
  );
}
