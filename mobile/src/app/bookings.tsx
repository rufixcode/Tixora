import { AppAlert } from "@/lib/alert";
import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { AppState, ScrollView, Text, View } from "react-native";
import { AppScreen } from "@/components/screen";
import { PrimaryButton } from "@/components/primary-button";
import { apiRequest } from "@/lib/api";
import { openCheckout } from "@/lib/checkout";
import { formatPrice } from "@/lib/events";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme/tokens";
import { QrTicket, type IssuedTicket } from "@/components/qr-ticket";
type Booking = {
  id: number;
  event_title: string;
  booking_reference: string;
  status: string;
  total_amount: number;
  tickets: IssuedTicket[];
  seats: { row_label: string; seat_number: number }[];
};
export default function Bookings() {
  const router = useRouter();
  const { session } = useAuth();
  const [items, setItems] = useState<Booking[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const load = useCallback(async () => {
    if (!session) {
      setItems([]);
      pending.current = false;
      setError("Sign in to view your bookings.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const bookings = await apiRequest<Booking[]>("/bookings", {
        token: session.token,
      });
      setItems(bookings);
      pending.current = bookings.some(
        (booking) => booking.status === "pending",
      );
    } catch (e) {
      setItems([]);
      pending.current = false;
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [session]);
  useFocusEffect(
    useCallback(() => {
      void load();
      const timer = setInterval(() => {
        if (pending.current && AppState.currentState === "active") void load();
      }, 15000);
      return () => clearInterval(timer);
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
          Test payments only. Your QR tickets appear after payment is verified.
          Return here after paying; your booking status refreshes automatically.
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
              <QrTicket
                key={t.ticket_number}
                ticket={t}
                title={b.event_title}
                reference={b.booking_reference}
              />
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
                    AppAlert.alert(
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
