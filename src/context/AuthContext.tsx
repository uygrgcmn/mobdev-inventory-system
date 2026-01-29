import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { apiFetch, setToken, clearToken, fetchMe, getToken } from "../services/api";
import { runExecute } from "../db/db";
import { syncAllServer } from "../services/syncService";

// ... (Role and User types remain unchanged)
export type Role = "Admin" | "Manager" | "Staff";
type User = { id: number; username: string; role: Role; organizationName?: string };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
};

const Ctx = createContext<AuthCtx>({} as any);

function normalizeRole(r: string | null | undefined): Role {
  const v = (r ?? "").trim();
  return v === "Admin" || v === "Manager" || v === "Staff" ? v : "Staff";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ⬇️ Uygulama açılışında token’ı okuyup kullanıcıyı getir
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetchMe();
        const u = res.data;
        setUser({
          id: u.id,
          username: u.username,
          role: normalizeRole(u.role),
          organizationName: u.organizationName
        });
      } catch {
        // token geçersizse sessizce görmezden gel
        await clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Helper to clear local DB (renamed for clarity/reuse)
  const clearLocalData = async () => {
    try {
      await runExecute("DELETE FROM products");
      await runExecute("DELETE FROM suppliers");
      await runExecute("DELETE FROM stock_transactions");
      await runExecute("DELETE FROM notifications");
      // Reset sync info to force full re-download on next login
      await runExecute("UPDATE sync_info SET lastSync = NULL");
      console.log("Local DB cleared (user switch or logout)");
    } catch (e) {
      console.error("Clear table error:", e);
    }
  };

  const signIn = async (username: string, password: string) => {
    // 1. Authenticate with backend
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    const newData = res.data;
    const newUserId = newData.user.id;

    // 2. Check if user changed (Data Isolation Logic)
    const lastUserIdStr = await SecureStore.getItemAsync("lastUserId");
    if (lastUserIdStr) {
      const lastUserId = parseInt(lastUserIdStr, 10);
      if (lastUserId !== newUserId) {
        console.log(`User changed (${lastUserId} -> ${newUserId}). Wiping local data...`);
        await clearLocalData();
      } else {
        console.log("Same user logged in. Keeping local data (Offline logic).");
      }
    } else {
      // No previous user recorded, safe to assume we can keep or wipe? 
      // Safest is to wipe if we are not sure, OR if it's a fresh install it's empty anyway.
      // But if user cleared data, lastUserId is gone.
    }

    // 3. Save new state
    await SecureStore.setItemAsync("lastUserId", String(newUserId));
    await setToken(newData.token);

    const u = newData.user;
    setUser({
      id: u.id,
      username: u.username,
      role: normalizeRole(u.role),
      organizationName: u.organizationName
    });
  };

  const forceLogout = async () => {
    await clearLocalData();
    await clearToken();
    setUser(null);
  };

  const signOut = async () => {
    if (!user?.id) {
      await forceLogout();
      return;
    }

    // 1. Try to sync before wiping
    console.log("Syncing before logout...");
    try {
      await syncAllServer(user.id);
      console.log("Logout sync success");
      // Success? Proceed to wipe
      await forceLogout();
    } catch (err: any) {
      console.warn("Logout sync failed:", err);
      // Sync failed! Ask user what to do.
      Alert.alert(
        "Senkronizasyon Hatası",
        "Veriler sunucuya gönderilemedi (İnternet yok veya sunucu hatası). \n\nÇıkış yaparsanız GÖNDERİLMEMİŞ VERİLER SİLİNECEK.\n\nNe yapmak istersiniz?",
        [
          { text: "Vazgeç (Verileri Koru)", style: "cancel" }, // Do nothing, keep user logged in
          {
            text: "Tekrar Dene",
            onPress: () => signOut() // Recursive retry
          },
          {
            text: "Yine de Çık (Verileri Sil)",
            style: "destructive",
            onPress: async () => await forceLogout()
          }
        ]
      );
    }
  };

  return <Ctx.Provider value={{ user, loading, signIn, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth() { return useContext(Ctx); }
