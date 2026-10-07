import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { BrandLogo } from "@/components/brand-logo";
import { PrimaryButton } from "@/components/primary-button";
import { AppScreen } from "@/components/screen";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme/tokens";
export default function Account() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await signOut();
      router.replace("/login" as never);
    } catch {
      setError(
        "You are signed out on this device. The server could not be reached.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 16 }}
      >
        <BrandLogo />
        <Text style={{ fontSize: 28, fontWeight: "800" }}>My account</Text>
        <View
          style={{
            padding: 20,
            backgroundColor: colors.primarySoft,
            borderRadius: 16,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "800" }}>
            {session?.user.name}
          </Text>
          <Text>{session?.user.email}</Text>
        </View>
        <PrimaryButton
          label="My bookings and tickets"
          onPress={() => router.push("/bookings" as never)}
        />
        <PrimaryButton
          label="Saved events"
          onPress={() => router.push("/favorites" as never)}
        />
        <PrimaryButton
          label="Account settings"
          onPress={() => router.push("/settings" as never)}
        />
        {session?.user.is_admin && (
          <PrimaryButton
            label="Admin dashboard"
            onPress={() => router.push("/admin" as never)}
          />
        )}
        <PrimaryButton
          label="Sign out"
          disabled={busy}
          onPress={() => void logout()}
        />
        {!!error && <Text accessibilityRole="alert">{error}</Text>}
      </ScrollView>
    </AppScreen>
  );
}
