import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
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
    if (!session || !review || busy || paymentLock.current) return;
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
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 16 }}
      >
        <Text style={{ fontSize: 28, fontWeight: "800" }}>
          Review your seats
        </Text>
        <Text>
          Complete payment before your seat hold expires. Test mode · No real
          charges. Your QR tickets appear in My bookings after payment
          verification.
        </Text>
        {review && (
          <View
            style={{
              backgroundColor: colors.primarySoft,
              padding: 20,
              borderRadius: 16,
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "800" }}>
              {review.screening.cinema_name} - {review.screening.screen_name}
            </Text>
            <Text>
              {new Date(review.screening.start_time).toLocaleString()}
            </Text>
            <Text>
              {review.seats
                .map((s) => `${s.row_label}${s.seat_number}`)
                .join(", ")}
            </Text>
            <Text
              style={{ fontSize: 24, fontWeight: "800", color: colors.primary }}
            >
              {formatPrice(review.total_amount)}
            </Text>
          </View>
        )}
        {!!error && (
          <Text accessibilityRole="alert" style={{ color: colors.destructive }}>
            {error}
          </Text>
        )}
        {review && (
          <PrimaryButton
            label={busy ? "Please wait..." : "Continue to payment"}
            disabled={busy}
            onPress={() => void pay()}
          />
        )}
        <PrimaryButton
          label="My bookings and payment status"
          disabled={busy}
          onPress={() => router.push("/bookings" as never)}
        />
        {review && !paymentStarted && (
          <PrimaryButton
            label="Release seats"
            disabled={busy}
            onPress={() => void release()}
          />
        )}
        <PrimaryButton
          label="Choose seats again"
          disabled={busy || paymentStarted}
          onPress={() =>
            router.replace(
              `/cinema/${slug}/screenings/${screeningId}/seats` as never,
            )
          }
        />
      </ScrollView>
    </AppScreen>
  );
}
