import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { AppScreen } from "@/components/screen";
import { PrimaryButton } from "@/components/primary-button";
import { apiRequest } from "@/lib/api";
import type { TixEvent } from "@/lib/events";
import { useAuth } from "@/providers/auth-provider";
export default function Favorites() {
  const router = useRouter();
  const { session } = useAuth();
  const [items, setItems] = useState<TixEvent[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      setItems(
        await apiRequest<TixEvent[]>("/favorites", { token: session.token }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [session]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function remove(slug: string) {
    if (!session) return;
    setBusy(true);
    try {
      await apiRequest(`/favorites/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        token: session.token,
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 16 }}
      >
        <PrimaryButton label="Back" onPress={() => router.back()} />
        <Text style={{ fontSize: 28, fontWeight: "800" }}>Saved events</Text>
        <PrimaryButton
          label={busy ? "Loading..." : "Refresh"}
          disabled={busy}
          onPress={() => void load()}
        />
        {!!error && <Text accessibilityRole="alert">{error}</Text>}
        {!busy && !items.length && <Text>No saved events yet.</Text>}
        {items.map((e) => (
          <View
            key={e.slug}
            style={{
              borderWidth: 1,
              borderColor: "#E6E2E7",
              borderRadius: 16,
              padding: 16,
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "800" }}>{e.title}</Text>
            <Text>
              {e.category} - {e.date}
            </Text>
            <PrimaryButton
              label="View event"
              onPress={() => router.push(`/events/${e.slug}` as never)}
            />
            <PrimaryButton
              label="Remove from saved"
              disabled={busy}
              onPress={() => void remove(e.slug)}
            />
          </View>
        ))}
      </ScrollView>
    </AppScreen>
  );
}
