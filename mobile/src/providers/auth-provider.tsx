import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";
import { clearSession, readSession, saveSession } from "@/lib/session-storage";

export type AuthUser = {
  id?: number;
  name: string;
  email: string;
  is_admin?: boolean;
  is_security?: boolean;
  username?: string | null;
  preferences?: { favorite_category?: string } | null;
};
export type AuthSession = { token: string; user: AuthUser };
type AuthStatus = "loading" | "authenticated" | "unauthenticated";
type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: AuthUser) => Promise<void>;
  forget: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);
type AuthResponse = { message: string; token: string; user: AuthUser };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);
  useEffect(() => {
    void (async () => {
      let restored = false;
      try {
        const stored = await readSession();
        if (!stored) return;
        const result = await apiRequest<{ user: AuthUser }>("/me", {
          token: stored.token,
        });
        const refreshed = { ...stored, user: result.user };
        setSession(refreshed);
        await saveSession(refreshed);
        restored = true;
      } catch {
        await clearSession();
      } finally {
        setStatus(restored ? "authenticated" : "unauthenticated");
      }
    })();
  }, []);
  async function establish(path: "/login" | "/register", body: object) {
    const response = await apiRequest<AuthResponse>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const next = { token: response.token, user: response.user };
    await saveSession(next);
    setSession(next);
    setStatus("authenticated");
  }
  async function signIn(email: string, password: string) {
    await establish("/login", { email, password });
  }
  async function signUp(
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ) {
    await establish("/register", {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
  }
  async function signOut() {
    try {
      if (session)
        await apiRequest("/logout", { method: "POST", token: session.token });
    } finally {
      await clearSession();
      setSession(null);
      setStatus("unauthenticated");
    }
  }
  async function updateUser(user: AuthUser) {
    if (!session) return;
    const next = { ...session, user };
    await saveSession(next);
    setSession(next);
  }
  async function forget() {
    await clearSession();
    setSession(null);
    setStatus("unauthenticated");
  }
  return (
    <AuthContext.Provider
      value={{ status, session, signIn, signUp, signOut, updateUser, forget }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
