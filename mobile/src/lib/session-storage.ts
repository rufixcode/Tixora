import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AuthSession } from '@/providers/auth-provider';

const sessionKey = 'tixora.auth.session';

function browserStorage() {
  // Static web rendering has no `window`; the storage is only needed in a browser.
  return typeof window === 'undefined' ? null : window.localStorage;
}

async function readValue() {
  if (Platform.OS === 'web') return browserStorage()?.getItem(sessionKey) ?? null;
  return SecureStore.getItemAsync(sessionKey);
}

async function saveValue(value: string) {
  if (Platform.OS === 'web') { browserStorage()?.setItem(sessionKey, value); return; }
  await SecureStore.setItemAsync(sessionKey, value);
}

async function removeValue() {
  if (Platform.OS === 'web') { browserStorage()?.removeItem(sessionKey); return; }
  await SecureStore.deleteItemAsync(sessionKey);
}

export async function readSession(): Promise<AuthSession | null> {
  const raw = await readValue();
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthSession; } catch { await removeValue(); return null; }
}

export async function saveSession(session: AuthSession) { await saveValue(JSON.stringify(session)); }
export async function clearSession() { await removeValue(); }
