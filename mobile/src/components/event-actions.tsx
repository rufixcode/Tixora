import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { View, Text, Pressable, TextInput } from "react-native";
import { PrimaryButton } from "@/components/primary-button";
import { apiRequest } from "@/lib/api";
import { openCheckout, requestKey } from "@/lib/checkout";
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
  const key = useRef<string | null>(null);
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
  async function pay() {
    if (busy) return;
    if (!session) {
      router.push("/login" as never);
      return;
    }
    setBusy(true);
    setError("");
    key.current ??= requestKey();
    try {
      const result = await apiRequest<{ checkout_url: string }>(
        `/events/${encodeURIComponent(event.slug)}/bookings`,
        {
          method: "POST",
          token: session.token,
          body: JSON.stringify({
            ticket_type_id: tier,
            quantity: Number(quantity),
            request_key: key.current,
          }),
        },
      );
      const checkout = openCheckout(result.checkout_url);
      router.replace("/bookings" as never);
      await checkout;
    } catch (e) {
      setError(
        `${(e as Error).message} Check My bookings before starting another order.`,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 12, marginTop: 20 }}>
      <PrimaryButton
        label={saved ? "Saved - remove" : "Save event"}
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
                key.current = null;
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
              key.current = null;
            }}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              padding: 12,
              borderRadius: 12,
            }}
          />
          <Text style={{ color: colors.mutedForeground }}>
            Test mode · No real charges.
          </Text>
          <PrimaryButton
            label={busy ? "Please wait..." : "Continue to payment"}
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
            onPress={() => void pay()}
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
