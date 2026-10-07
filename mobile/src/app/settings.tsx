import { LoginSettings } from "@/components/login-settings";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, Text, TextInput, Pressable, View, StyleSheet } from "react-native";
import { BackButton } from "@/components/back-button";
import { AppScreen } from "@/components/screen";
import { PrimaryButton } from "@/components/primary-button";
import { apiRequest } from "@/lib/api";
import { useAuth, type AuthUser } from "@/providers/auth-provider";
import { colors, radius, spacing, typography } from "@/theme/tokens";
export default function Settings() {
  const router = useRouter();
  const { session, updateUser, forget, signOut } = useAuth();
  const [name, setName] = useState(session?.user.name ?? "");
  const [username, setUsername] = useState(session?.user.username ?? "");
  const [category, setCategory] = useState(
    session?.user.preferences?.favorite_category ?? "All",
  );
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  async function save() {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const r = await apiRequest<{ user: AuthUser }>("/settings", {
        method: "PATCH",
        token: session.token,
        body: JSON.stringify({
          name,
          username: username || null,
          preferences: { favorite_category: category },
        }),
      });
      await updateUser(r.user);
      setMessage("Settings saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!session || confirmation !== "DELETE") return;
    setBusy(true);
    setError("");
    try {
      await apiRequest("/account", {
        method: "DELETE",
        token: session.token,
        body: JSON.stringify({ password, confirmation }),
      });
      await forget();
      router.replace("/login" as never);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setSigningOut(true);
    setError("");
    try {
      await signOut();
      router.replace("/login" as never);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSigningOut(false);
    }
  }
  const input = {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    borderRadius: 12,
    color: colors.foreground,
  };
  return (
    <AppScreen><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.header}><BackButton label="Back to My Account" onPress={() => router.back()} /><Text style={styles.title}>Profile Settings</Text><View style={styles.headerSpacer} /></View>
        <Text style={styles.copy}>Manage your account information and preferences.</Text>
        <Text style={styles.label}>Name</Text>
        <TextInput
          accessibilityLabel="Name"
          style={input}
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.label}>Username</Text>
        <TextInput
          accessibilityLabel="Username"
          autoCapitalize="none"
          style={input}
          value={username}
          onChangeText={setUsername}
        />
        <Text style={styles.label}>Favorite category</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {["All", "Concerts", "Movies", "Events"].map((c) => (
            <Pressable
              key={c}
              accessibilityRole="button"
              onPress={() => setCategory(c)}
              style={[
                input,
                {
                  backgroundColor:
                    c === category ? colors.primarySoft : colors.card,
                },
              ]}
            >
              <Text>{c}</Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton
          label="Save settings"
          disabled={busy || !session}
          onPress={() => void save()}
        />
        {!!message && <Text style={styles.message}>{message}</Text>}
        {!!error && (
          <Text accessibilityRole="alert" style={{ color: colors.destructive }}>
            {error}
          </Text>
        )}
        {session && <LoginSettings email={session.user.email} />}
        <View style={styles.accountAction}><Text style={styles.sectionTitle}>Account</Text><Text style={styles.copy}>
          Sign out on this device. Your saved session will be cleared.
        </Text><Pressable accessibilityRole="button" disabled={signingOut} onPress={() => void logout()} style={styles.signOut}><Text style={styles.signOutText}>{signingOut ? "Signing out…" : "Sign out"}</Text></Pressable></View>
        <Text style={styles.dangerTitle}>Delete account</Text>
        <Text style={styles.copy}>
          This permanently deletes your account. Accounts with active bookings
          cannot be deleted.
        </Text>
        <TextInput
          accessibilityLabel="Current password"
          secureTextEntry
          placeholder="Current password"
          style={input}
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          accessibilityLabel="Type DELETE to confirm"
          placeholder="Type DELETE to confirm"
          style={input}
          value={confirmation}
          onChangeText={setConfirmation}
        />
        <PrimaryButton
          label="Permanently delete account"
          disabled={busy || confirmation !== "DELETE" || !password}
          onPress={() => void remove()}
        />
      </ScrollView></AppScreen>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: 120 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  headerSpacer: { width: 40 },
  title: { color: colors.foreground, fontSize: typography.title, fontWeight: "800" },
  copy: { color: colors.mutedForeground, fontSize: typography.label, lineHeight: 20 },
  label: { color: colors.foreground, fontSize: typography.label, fontWeight: "800", marginTop: spacing.xs },
  message: { color: colors.success, fontSize: typography.label, fontWeight: "700" },
  accountAction: { backgroundColor: colors.secondary, borderRadius: radius.md, gap: spacing.sm, marginTop: spacing.md, padding: spacing.md },
  sectionTitle: { color: colors.foreground, fontSize: typography.title, fontWeight: "800" },
  signOut: { alignItems: "center", borderColor: colors.destructive, borderRadius: radius.md, borderWidth: 1, minHeight: 48, justifyContent: "center", marginTop: spacing.xs },
  signOutText: { color: colors.destructive, fontSize: typography.label, fontWeight: "800" },
  dangerTitle: { color: colors.destructive, fontSize: typography.title, fontWeight: "800", marginTop: spacing.xl },
});
