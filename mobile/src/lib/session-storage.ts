import * as SecureStore from 'expo-secure-store';

import type { AuthSession } from '@/providers/auth-provider';

const sessionKey = 'tixora.auth.session';
export async function readSession(): Promise<AuthSession | null> { const raw = await SecureStore.getItemAsync(sessionKey); if (!raw) return null; try { return JSON.parse(raw) as AuthSession; } catch { await SecureStore.deleteItemAsync(sessionKey); return null; } }
export async function saveSession(session: AuthSession) { await SecureStore.setItemAsync(sessionKey, JSON.stringify(session)); }
export async function clearSession() { await SecureStore.deleteItemAsync(sessionKey); }
