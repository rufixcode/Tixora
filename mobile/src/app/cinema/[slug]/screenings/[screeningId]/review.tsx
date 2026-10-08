import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme/tokens";
export default function BookingReviewScreen() {
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
          Your selected seats are held while this review is open. Payment is
          not part of this phase.
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
        {review && <PrimaryButton label="Release seats" disabled={busy} onPress={() => void release()} />}
        <PrimaryButton
          label="Choose seats again"
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
