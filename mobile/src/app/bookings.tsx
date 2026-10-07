import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";
import { AppScreen } from "@/components/screen";
import { PrimaryButton } from "@/components/primary-button";
import { apiRequest } from "@/lib/api";
import { openCheckout } from "@/lib/checkout";
import { formatPrice } from "@/lib/events";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme/tokens";
type Booking = {
  id: number;
  event_title: string;
  booking_reference: string;
  status: string;
  total_amount: number;
  tickets: { ticket_number: string; status: string }[];
  seats: { row_label: string; seat_number: number }[];
};
export default function Bookings() {
  const router = useRouter();
  const { session } = useAuth();
  const [items, setItems] = useState<Booking[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!session) {
      setError("Sign in to view your bookings.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      setItems(
        await apiRequest<Booking[]>("/bookings", { token: session.token }),
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
  async function action(id: number, kind: "checkout" | "cancel") {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const r = await apiRequest<{ checkout_url?: string }>(
        `/bookings/${id}/${kind}`,
        { method: "POST", token: session.token },
      );
      if (r.checkout_url) await openCheckout(r.checkout_url);
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
        <Text style={{ fontSize: 28, fontWeight: "800" }}>My bookings</Text>
        <Text>
          Sandbox payments only. Refresh after paying. Pending bookings hold
          inventory until paid or cancelled.
        </Text>
        <PrimaryButton
          label={busy ? "Loading..." : "Refresh status"}
          disabled={busy}
          onPress={() => void load()}
        />
        {!!error && (
          <Text accessibilityRole="alert" style={{ color: colors.destructive }}>
            {error}
          </Text>
        )}
        {!busy && !error && !items.length && <Text>No bookings yet.</Text>}
        {items.map((b) => (
          <View
            key={b.id}
            style={{
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "800" }}>
              {b.event_title ?? b.booking_reference}
            </Text>
            <Text>{b.booking_reference}</Text>
            <Text>
              {b.status} - {formatPrice(b.total_amount)}
            </Text>
            {!!b.seats.length && (
              <Text>
                Seats:{" "}
                {b.seats
                  .map((s) => `${s.row_label}${s.seat_number}`)
                  .join(", ")}
              </Text>
            )}
            {b.tickets.map((t) => (
              <Text key={t.ticket_number}>
                Ticket {t.ticket_number} - {t.status}
              </Text>
            ))}
            {b.status === "pending" && (
              <>
                <PrimaryButton
                  label="Resume test payment"
                  disabled={busy}
                  onPress={() => void action(b.id, "checkout")}
                />
                <PrimaryButton
                  label="Cancel booking"
                  disabled={busy}
                  onPress={() =>
                    Alert.alert(
                      "Cancel booking?",
                      "This releases the reserved tickets.",
                      [
                        { text: "Keep booking", style: "cancel" },
                        {
                          text: "Cancel booking",
                          style: "destructive",
                          onPress: () => void action(b.id, "cancel"),
                        },
                      ],
                    )
                  }
                />
              </>
            )}
          </View>
        ))}
      </ScrollView>
    </AppScreen>
  );
}
