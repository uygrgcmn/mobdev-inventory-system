import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, setToken, clearToken, fetchMe, getToken } from "../services/api";

export type Role = "Admin" | "Manager" | "Staff";
type User = { id: number; username: string; role: Role };

type AuthCtx = {
  user: User | null;
  loading: boolean;  // ⬅️ eklendi
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
  const [loading, setLoading] = useState(true); // ⬅️ eklendi

  // ⬇️ Uygulama açılışında token’ı okuyup kullanıcıyı getir
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetchMe(); // { ok:true, data:{ id, username, role } }
        const u = res.data;
        setUser({ id: u.id, username: u.username, role: normalizeRole(u.role) });
      } catch {
        // token geçersizse sessizce görmezden gel
        await clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (username: string, password: string) => {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    await setToken(res.data.token);
    const u = res.data.user;
    setUser({ id: u.id, username: u.username, role: normalizeRole(u.role) });
  };

  const signOut = () => { clearToken(); setUser(null); };

  return <Ctx.Provider value={{ user, loading, signIn, signOut }}>{children}</Ctx.Provider>;
}
export function useAuth() { return useContext(Ctx); }
