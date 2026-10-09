import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { View, Text, Pressable, TextInput } from "react-native";
import { PrimaryButton } from "@/components/primary-button";
import { apiRequest } from "@/lib/api";
import { formatPrice, type TixEvent } from "@/lib/events";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme/tokens";
export function EventActions({ event }: { event: TixEvent }) {
  const router = useRouter();
  const { session } = useAuth();
  const [tier, setTier] = useState(event.tiers[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!session) return;
    let active = true;
    apiRequest<{ slug: string }[]>("/favorites", { token: session.token })
      .then((items) => {
        if (active) setSaved(items.some((e) => e.slug === event.slug));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [session, event.slug]);
  async function favorite() {
    if (!session) return;
    setBusy(true);
    try {
      await apiRequest(`/favorites/${encodeURIComponent(event.slug)}`, {
        method: saved ? "DELETE" : "PUT",
        token: session.token,
      });
      setSaved(!saved);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 12, marginTop: 20 }}>
      <PrimaryButton
        variant="text"
        label={saved ? "Saved · Remove" : "Save event"}
        onPress={() => void favorite()}
        disabled={busy || !session}
      />
      {event.category === "Movies" ? (
        <PrimaryButton
          label="View available showtimes"
          onPress={() =>
            router.push(`/cinema/${event.slug}/screenings` as never)
          }
        />
      ) : (
        <>
          {event.tiers.map((t) => (
            <Pressable
              key={t.id}
              accessibilityRole="button"
              onPress={() => {
                setTier(t.id);
              }}
              style={{
                padding: 14,
                borderWidth: 1,
                borderColor: tier === t.id ? colors.primary : colors.border,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: colors.foreground }}>
                {t.name} - {formatPrice(t.price)} - {t.remaining} left
              </Text>
            </Pressable>
          ))}
          <Text>Quantity (1-8)</Text>
          <TextInput
            accessibilityLabel="Quantity"
            keyboardType="number-pad"
            value={quantity}
            onChangeText={(v) => {
              setQuantity(v);
            }}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              padding: 12,
              borderRadius: 12,
            }}
          />

          <PrimaryButton
            label={busy ? "Please wait..." : "Review booking"}
            disabled={
              busy ||
              !event.booking_available ||
              !tier ||
              Number(quantity) < 1 ||
              Number(quantity) > 8 ||
              !Number.isInteger(Number(quantity)) ||
              Number(quantity) >
                (event.tiers.find((item) => item.id === tier)?.remaining ?? 0)
            }
            onPress={() =>
              router.push({
                pathname: "/checkout",
                params: { slug: event.slug, tier, quantity },
              } as never)
            }
          />
        </>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: colors.destructive }}>
          {error}
        </Text>
      )}
    </View>
  );
}
