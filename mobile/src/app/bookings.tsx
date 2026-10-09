import { AppAlert } from "@/lib/alert";
import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { AppState, ScrollView, StyleSheet, Text, View } from "react-native";
import { BackButton } from "@/components/back-button";
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
  const actionLock = useRef(false);
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
        if (
          pending.current &&
          !actionLock.current &&
          AppState.currentState === "active"
        )
          void load();
      }, 15000);
      return () => clearInterval(timer);
    }, [load]),
  );
  async function action(id: number, kind: "checkout" | "cancel") {
    if (!session || busy || actionLock.current) return;
    actionLock.current = true;
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
      actionLock.current = false;
      setBusy(false);
    }
  }
  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <BackButton
            label="Back to account"
            onPress={() => router.replace("/account" as never)}
          />
          <Text style={styles.eyebrow}>TIXORA · YOUR TICKETS</Text>
        </View>
        <Text style={styles.title}>My bookings</Text>
        <Text style={styles.copy}>
          Your plans, payments, and entry passes in one place.
        </Text>
        <PrimaryButton
          label={busy ? "Loading..." : "Refresh status"}
          variant="secondary"
          disabled={busy}
          onPress={() => void load()}
        />
        {!!error && (
          <Text accessibilityRole="alert" style={{ color: colors.destructive }}>
            {error}
          </Text>
        )}
        {!busy && !error && !items.length && (
          <View style={styles.notice}>
            <Text style={styles.heading}>Your next outing starts here.</Text>
            <Text style={styles.copy}>
              Book a screening or event to find your tickets here.
            </Text>
            <PrimaryButton
              label="Explore events"
              onPress={() => router.push("/discover" as never)}
            />
          </View>
        )}
        {items.map((b) => (
          <View key={b.id} style={styles.booking}>
            <View style={styles.row}>
              <Text
                style={[
                  styles.status,
                  b.status === "confirmed" && styles.confirmed,
                ]}
              >
                {b.status === "confirmed"
                  ? "PAYMENT VERIFIED"
                  : b.status === "pending"
                    ? "PAYMENT PENDING"
                    : b.status.toUpperCase()}
              </Text>
              <Text style={styles.test}>TEST MODE</Text>
            </View>
            <Text style={styles.heading}>
              {b.event_title ?? b.booking_reference}
            </Text>
            <Text selectable style={styles.reference}>
              {b.booking_reference}
            </Text>
            <View style={styles.row}>
              <Text style={styles.copy}>Booking total</Text>
              <Text style={styles.total}>{formatPrice(b.total_amount)}</Text>
            </View>
            {!!b.seats.length && (
              <Text style={styles.copy}>
                Seats:{" "}
                {b.seats
                  .map((s) => `${s.row_label}${s.seat_number}`)
                  .join(", ")}
              </Text>
            )}
            {b.status === "confirmed" &&
              b.tickets.map((t) => (
                <QrTicket
                  key={t.ticket_number}
                  ticket={t}
                  title={b.event_title}
                  reference={b.booking_reference}
                />
              ))}
            {b.status === "pending" && (
              <>
                <View style={styles.notice}>
                  <Text style={styles.noticeTitle}>
                    Waiting for payment verification
                  </Text>
                  <Text style={styles.copy}>
                    Already paid? Refresh the status while PayMongo confirms it.
                    Your QR will appear once verification is complete.
                  </Text>
                </View>
                <PrimaryButton
                  label="Continue test payment"
                  disabled={busy}
                  onPress={() => void action(b.id, "checkout")}
                />
                <PrimaryButton
                  label="Cancel booking"
                  variant="text"
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
const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: { color: colors.foreground, fontSize: 30, fontWeight: "800" },
  copy: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21 },
  heading: { color: colors.foreground, fontSize: 21, fontWeight: "800" },
  booking: {
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.card,
    gap: 14,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  reference: { color: colors.mutedForeground, fontSize: 11 },
  total: { color: colors.primary, fontSize: 22, fontWeight: "800" },
  status: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    color: colors.primaryDeep,
    fontWeight: "800",
    fontSize: 10,
  },
  confirmed: { backgroundColor: "#E8F5ED", color: colors.success },
  test: {
    color: colors.mutedForeground,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "700",
  },
  notice: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  noticeTitle: { color: colors.primaryDeep, fontSize: 14, fontWeight: "800" },
});
