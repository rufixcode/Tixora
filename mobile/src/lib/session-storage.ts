import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { AuthSession } from "@/providers/auth-provider";

const sessionKey = "tixora.auth.session";

let browserSession: string | null = null;
// Expo web is a development preview. Keep tokens in memory, never web storage.
function clearLegacyBrowserSession() {
  try {
    if (typeof window !== "undefined")
      window.localStorage.removeItem(sessionKey);
  } catch {
    /* storage unavailable */
  }
}

async function readValue() {
  if (Platform.OS === "web") {
    clearLegacyBrowserSession();
    return browserSession;
  }
  return SecureStore.getItemAsync(sessionKey);
}

async function saveValue(value: string) {
  if (Platform.OS === "web") {
    clearLegacyBrowserSession();
    browserSession = value;
    return;
  }
  await SecureStore.setItemAsync(sessionKey, value);
}

async function removeValue() {
  if (Platform.OS === "web") {
    clearLegacyBrowserSession();
    browserSession = null;
    return;
  }
  await SecureStore.deleteItemAsync(sessionKey);
}

export async function readSession(): Promise<AuthSession | null> {
  const raw = await readValue();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    await removeValue();
    return null;
  }
}

export async function saveSession(session: AuthSession) {
  await saveValue(JSON.stringify(session));
}
export async function clearSession() {
  await removeValue();
}
