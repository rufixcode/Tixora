import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CheckoutReview } from "@/components/checkout-review";
import { AppScreen } from "@/components/screen";
import { LoadingState, MessageState } from "@/components/state-view";
import {
  releaseSeatHold,
  reviewSeatHold,
  type BookingReview,
} from "@/lib/cinema";

import { apiRequest } from "@/lib/api";
import { prepareCheckout, requestKey } from "@/lib/checkout";
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
    let checkout: ReturnType<typeof prepareCheckout> | undefined;
    try {
      checkout = prepareCheckout();
      setPaymentStarted(true);
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
      await checkout.open(result.checkout_url);
      router.replace("/bookings" as never);
    } catch (e) {
      checkout?.cancel();
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
  if (!review)
    return (
      <AppScreen>
        <MessageState
          title="Seats unavailable"
          detail={error}
          actionLabel="Choose seats again"
          onAction={() =>
            router.replace(
              `/cinema/${slug}/screenings/${screeningId}/seats` as never,
            )
          }
        />
      </AppScreen>
    );
  return (
    <CheckoutReview
      total={review.total_amount}
      quantity={review.seats.length}
      unitPrice={review.screening.ticket_price}
      busy={busy}
      disabled={expired}
      error={error}
      onPay={() => void pay()}
      onChange={!paymentStarted ? () => void release() : undefined}
      notice={
        expired
          ? "Seat hold expired. Choose your seats again."
          : paymentStarted
            ? "Check My bookings before starting another order."
            : remaining === null
              ? "Your seats are temporarily held"
              : `Seats reserved for ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
      }
    >
      <Text style={styles.heading}>{review.screening.cinema_name}</Text>
      <Text style={styles.copy}>
        {review.screening.screen_name} · {review.screening.city}
      </Text>
      <Text style={styles.copy}>
        {new Intl.DateTimeFormat("en-PH", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(review.screening.start_time))}
      </Text>
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
    </CheckoutReview>
  );
}
const styles = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: "800", color: colors.foreground },
  copy: { fontSize: 13, lineHeight: 20, color: colors.mutedForeground },
  seats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  seat: {
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  seatText: { color: colors.primary, fontWeight: "700" },
});
