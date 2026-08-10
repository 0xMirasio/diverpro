import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "bluemates.mobile.access-token";
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || "https://bluemates.duckdns.org").replace(/\/$/, "");

let accessToken: string | null = null;

export class ApiError extends Error {
  constructor(public code: string, public status: number, public details?: unknown) {
    super(code);
  }
}

export async function loadToken() {
  accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
  return accessToken;
}

export async function saveToken(token: string | null) {
  accessToken = token;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function mediaSource(path: string | null | undefined) {
  if (!path) return undefined;
  return { uri: path.startsWith("http") ? path : `${API_URL}${path}`, headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined };
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.error || "REQUEST_FAILED", response.status, body);
  return body as T;
}

export async function uploadImage(uri: string, kind: "AVATAR" | "DIVE" | "REVIEW") {
  const filename = uri.split("/").pop() || "photo.jpg";
  const extension = filename.split(".").pop()?.toLowerCase();
  const type = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
  const form = new FormData();
  form.append("kind", kind);
  form.append("file", { uri, name: filename, type } as unknown as Blob);
  return api<{ media: { id: string; url: string } }>("/api/media", { method: "POST", body: form });
}
