// src/services/api.ts
import * as SecureStore from "expo-secure-store";

// Configurable API base (use EXPO_PUBLIC_API_URL in env; default emulator loopback)
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.105:5000/api";

export async function setToken(token: string) {
  await SecureStore.setItemAsync("token", token);
}
export async function getToken() {
  return SecureStore.getItemAsync("token");
}
export async function clearToken() {
  await SecureStore.deleteItemAsync("token");
}

function withTimeout<T>(p: Promise<T>, ms = 8000) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Network timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as any;

  const res = await withTimeout(fetch(`${API_URL}${path}`, { ...options, headers }));
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `API ${res.status}`);
  return json;
}

export async function fetchMe() {
  return apiFetch("/auth/me");
}
