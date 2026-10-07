import { LoginSettings } from "@/components/login-settings";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, Text, TextInput, Pressable, View } from "react-native";
import { AppScreen } from "@/components/screen";
import { PrimaryButton } from "@/components/primary-button";
import { apiRequest } from "@/lib/api";
import { useAuth, type AuthUser } from "@/providers/auth-provider";
import { colors } from "@/theme/tokens";
export default function Settings() {
  const router = useRouter();
  const { session, updateUser, forget } = useAuth();
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
  const input = {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    borderRadius: 12,
    color: colors.foreground,
  };
  return (
    <AppScreen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 14 }}
      >
        <PrimaryButton label="Back" onPress={() => router.back()} />
        <Text style={{ fontSize: 28, fontWeight: "800" }}>
          Account settings
        </Text>
        <Text>Name</Text>
        <TextInput
          accessibilityLabel="Name"
          style={input}
          value={name}
          onChangeText={setName}
        />
        <Text>Username</Text>
        <TextInput
          accessibilityLabel="Username"
          autoCapitalize="none"
          style={input}
          value={username}
          onChangeText={setUsername}
        />
        <Text>Favorite category</Text>
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
        {!!message && <Text>{message}</Text>}
        {!!error && (
          <Text accessibilityRole="alert" style={{ color: colors.destructive }}>
            {error}
          </Text>
        )}
        {session && <LoginSettings email={session.user.email} />}
        <Text style={{ fontSize: 20, fontWeight: "800", marginTop: 24 }}>
          Delete account
        </Text>
        <Text>
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
      </ScrollView>
    </AppScreen>
  );
}
