import { useState } from "react";
import { useRouter } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { PrimaryButton } from "@/components/primary-button";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme/tokens";
export function LoginSettings({ email }: { email: string }) {
  const router = useRouter();
  const { session, forget } = useAuth();
  const [form, setForm] = useState({
    email,
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest("/settings/credentials", {
        method: "PATCH",
        token: session.token,
        body: JSON.stringify(form),
      });
      await forget();
      router.replace("/login" as never);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 12, marginTop: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: "800" }}>
        Change login details
      </Text>
      <Text>
        Enter your current password to change login details. Leave the new
        password blank to keep it. Saving signs you out on all devices.
      </Text>
      {(Object.keys(form) as (keyof typeof form)[]).map((k) => (
        <View key={k}>
          <Text>
            {
              {
                email: "Email",
                current_password: "Current password",
                password: "New password (12+ characters)",
                password_confirmation: "Confirm new password",
              }[k]
            }
          </Text>
          <TextInput
            accessibilityLabel={k}
            secureTextEntry={k !== "email"}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={k === "email" ? "email-address" : "default"}
            editable={!busy}
            maxLength={k === "email" ? 255 : 128}
            value={form[k]}
            onChangeText={(value) => setForm({ ...form, [k]: value })}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
            }}
          />
        </View>
      ))}
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: colors.destructive }}>
          {error}
        </Text>
      )}
      <PrimaryButton
        label={busy ? "Saving…" : "Update login & sign out"}
        disabled={busy}
        onPress={() => void save()}
      />
    </View>
  );
}
