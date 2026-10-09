import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BackButton } from "@/components/back-button";
import { AppScreen } from "@/components/screen";
import { PrimaryButton } from "@/components/primary-button";
import { LoadingState, MessageState } from "@/components/state-view";
import {
  releaseSeatHold,
  reviewSeatHold,
  type BookingReview,
} from "@/lib/cinema";
import { formatPrice } from "@/lib/events";
import { apiRequest } from "@/lib/api";
import { openCheckout, requestKey } from "@/lib/checkout";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme/tokens";
export default function BookingReviewScreen() {
  const { screeningId, hold } = useLocalSearchParams<{
    screeningId: string;
    hold: string;
  }>();
  return <BookingReviewContent key={`${screeningId}:${hold}`} />;
}

function BookingReviewContent() {
  const router = useRouter();
  const { slug, screeningId, hold } = useLocalSearchParams<{
    slug: string;
    screeningId: string;
    hold: string;
  }>();
  const { session } = useAuth();
  const [review, setReview] = useState<BookingReview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const paymentKey = useRef<string | null>(null);
  const paymentLock = useRef(false);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!review?.expires_at) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [review?.expires_at]);
  const remaining = review?.expires_at
    ? Math.max(
        0,
        Math.ceil((new Date(review.expires_at).getTime() - now) / 1000),
      )
    : null;
  const expired = remaining === 0 && !paymentStarted;
  useEffect(() => {
    if (!session || !screeningId || !hold) return;
    let active = true;
    reviewSeatHold(screeningId, hold, session.token)
      .then((data) => {
        if (active) {
          setReview(data);
          setError("");
        }
      })
      .catch(() => {
        if (active)
          setError(
            "This hold has expired or is unavailable. Choose your seats again.",
          );
      });
    return () => {
      active = false;
    };
  }, [session, screeningId, hold]);
  async function pay() {
    if (!session || !review || busy || paymentLock.current || expired) return;
    paymentLock.current = true;
    setBusy(true);
    setError("");
    paymentKey.current ??= requestKey();
    setPaymentStarted(true);
    try {
      const result = await apiRequest<{ checkout_url: string }>(
        `/screenings/${screeningId}/bookings`,
        {
          method: "POST",
          token: session.token,
          body: JSON.stringify({
            hold_token: hold,
            request_key: paymentKey.current,
          }),
        },
      );
      const checkout = openCheckout(result.checkout_url);
      router.replace("/bookings" as never);
      await checkout;
    } catch (e) {
      setError(
        `${(e as Error).message} Check My bookings before choosing new seats. You can retry this payment safely.`,
      );
    } finally {
      paymentLock.current = false;
      setBusy(false);
    }
  }
  async function release() {
    if (!session || busy) return;
    setBusy(true);
    try {
      await releaseSeatHold(screeningId, hold, session.token);
      router.replace(
        `/cinema/${slug}/screenings/${screeningId}/seats` as never,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!session)
    return (
      <AppScreen>
        <MessageState
          title="Sign in to continue"
          detail="Your seats and bookings belong to your account."
          actionLabel="Sign in"
          onAction={() => router.push("/login" as never)}
        />
      </AppScreen>
    );
  if (!review && !error)
    return (
      <AppScreen>
        <LoadingState label="Validating your selected seats..." />
      </AppScreen>
    );
  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <BackButton label="Back" onPress={() => router.back()} />
          <Text style={styles.brand}>TIXORA CINEMA</Text>
        </View>
        <Text style={styles.eyebrow}>SEATS SELECTED · PAYMENT NEXT</Text>
        <Text style={styles.title}>Review your seats</Text>
        <Text style={styles.copy}>One last look before your movie night.</Text>
        {review && (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>YOUR SCREENING</Text>
              <Text style={styles.heading}>{review.screening.cinema_name}</Text>
              <Text style={styles.copy}>
                {review.screening.screen_name} · {review.screening.city}
              </Text>
              <Text style={styles.date}>
                {new Intl.DateTimeFormat("en-PH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(review.screening.start_time))}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.label}>SELECTED SEATS</Text>
              <View style={styles.seats}>
                {review.seats.map((seat) => (
                  <View key={seat.id} style={styles.seat}>
                    <Text style={styles.seatText}>
                      {seat.row_label}
                      {seat.seat_number}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={styles.copy}>
                {review.seats.length} admission{" "}
                {review.seats.length === 1 ? "ticket" : "tickets"}
              </Text>
            </View>
            {!paymentStarted && (
              <View style={styles.notice}>
                <Text style={styles.noticeTitle}>
                  {expired
                    ? "Seat hold expired"
                    : remaining === null
                      ? "Your seats are temporarily held"
                      : `Seats held for ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
                </Text>
                <Text style={styles.copy}>
                  {expired
                    ? "Choose your seats again to check availability."
                    : "Begin checkout before the hold expires."}
                </Text>
              </View>
            )}
            <View style={styles.card}>
              <Text style={styles.heading}>Payment summary</Text>
              <View style={styles.row}>
                <Text style={styles.copy}>
                  {review.seats.length} ×{" "}
                  {formatPrice(review.screening.ticket_price)}
                </Text>
                <Text style={styles.amount}>
                  {formatPrice(review.total_amount)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.heading}>Total</Text>
                <Text style={styles.total}>
                  {formatPrice(review.total_amount)}
                </Text>
              </View>
              <View style={styles.testBadge}>
                <Text style={styles.testText}>
                  TEST PAYMENT · NO REAL CHARGE
                </Text>
              </View>
              <Text style={styles.copy}>
                Continue to PayMongo to choose an available payment method.
                After verification, your admission QR appears in My bookings.
              </Text>
            </View>
          </>
        )}
        {!!error && (
          <View style={styles.notice}>
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          </View>
        )}
        {review && !expired && (
          <PrimaryButton
            label={
              busy
                ? "Opening secure checkout…"
                : paymentStarted
                  ? "Retry payment"
                  : `Continue to payment · ${formatPrice(review.total_amount)}`
            }
            disabled={busy}
            onPress={() => void pay()}
          />
        )}
        <PrimaryButton
          variant="secondary"
          label="My bookings & payment status"
          disabled={busy}
          onPress={() => router.push("/bookings" as never)}
        />
        {review && !paymentStarted && (
          <PrimaryButton
            variant="text"
            label="Release seats & choose again"
            disabled={busy}
            onPress={() => void release()}
          />
        )}
        {!review && (
          <PrimaryButton
            variant="text"
            label="Choose seats again"
            onPress={() =>
              router.replace(
                `/cinema/${slug}/screenings/${screeningId}/seats` as never,
              )
            }
          />
        )}
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
  brand: {
    color: colors.primary,
    fontWeight: "900",
    letterSpacing: 2,
    fontSize: 12,
  },
  eyebrow: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 12,
  },
  title: { fontSize: 30, fontWeight: "800", color: colors.foreground },
  copy: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    backgroundColor: colors.white,
  },
  heading: { color: colors.foreground, fontSize: 19, fontWeight: "800" },
  label: {
    color: colors.mutedForeground,
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: "800",
  },
  date: { color: colors.foreground, fontSize: 14, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  seats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  seat: {
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  seatText: { color: colors.primary, fontWeight: "800", fontSize: 16 },
  notice: {
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  noticeTitle: { color: colors.primaryDeep, fontWeight: "800", fontSize: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  amount: { color: colors.foreground, fontWeight: "700", fontSize: 14 },
  total: { color: colors.primary, fontWeight: "900", fontSize: 26 },
  testBadge: {
    backgroundColor: colors.muted,
    padding: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  testText: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  error: { color: colors.destructive, lineHeight: 21 },
});
