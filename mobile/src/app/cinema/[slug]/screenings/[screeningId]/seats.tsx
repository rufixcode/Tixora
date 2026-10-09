import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppScreen } from "@/components/screen";
import { BackButton } from "@/components/back-button";
import { LoadingState, MessageState } from "@/components/state-view";
import {
  createSeatHold,
  getScreeningSeats,
  type CinemaSeat,
  type SeatInventory,
} from "@/lib/cinema";
import { formatPrice } from "@/lib/events";
import { useAuth } from "@/providers/auth-provider";
import { colors, radius, spacing, typography } from "@/theme/tokens";

export default function SeatSelectionScreen() {
  const router = useRouter();
  const { slug, screeningId } = useLocalSearchParams<{
    slug: string;
    screeningId: string;
  }>();
  const { session } = useAuth();
  const [inventory, setInventory] = useState<SeatInventory | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const [holding, setHolding] = useState(false);
  const load = useCallback(async () => {
    if (!screeningId) return;
    setError(false);
    try {
      setInventory(await getScreeningSeats(screeningId));
      setSelected([]);
    } catch {
      setError(true);
    }
  }, [screeningId]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  const rows = useMemo(() => {
    const result = new Map<string, CinemaSeat[]>();
    inventory?.seats.forEach((seat) =>
      result.set(seat.row_label, [...(result.get(seat.row_label) ?? []), seat]),
    );
    return [...result.entries()];
  }, [inventory]);
  const selectedSeats =
    inventory?.seats.filter((seat) => selected.includes(seat.id)) ?? [];
  function toggleSeat(seat: CinemaSeat) {
    if (seat.status !== "available") return;
    setSelectionError("");
    setSelected((current) => {
      if (current.includes(seat.id))
        return current.filter((id) => id !== seat.id);
      if (inventory && current.length >= inventory.max_seats_per_order) {
        setSelectionError(
          `You can select up to ${inventory.max_seats_per_order} seats for this screening.`,
        );
        return current;
      }
      return [...current, seat.id];
    });
  }
  async function continueToReview() {
    if (!inventory || !session || !selected.length || holding) return;
    setHolding(true);
    setSelectionError("");
    try {
      const hold = await createSeatHold(screeningId, selected, session.token);
      router.push(
        `/cinema/${slug}/screenings/${screeningId}/review?hold=${encodeURIComponent(hold.hold_token)}` as never,
      );
    } catch (cause) {
      setSelectionError(
        cause instanceof Error
          ? cause.message
          : "The selected seats are no longer available.",
      );
      void load();
    } finally {
      setHolding(false);
    }
  }
  if (!inventory && !error)
    return (
      <AppScreen>
        <LoadingState label="Loading seat availability…" />
      </AppScreen>
    );
  if (error || !inventory)
    return (
      <AppScreen>
        <MessageState
          title="Couldn’t load seats"
          detail="Seat availability may have changed. Try again to refresh it."
          actionLabel="Refresh seats"
          onAction={() => void load()}
        />
      </AppScreen>
    );
  const { screening } = inventory;
  const total = selectedSeats.length * screening.ticket_price;
  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton label="Back to showtimes" onPress={() => router.back()} />
        <Text style={styles.title}>Choose your seats</Text>
        <Text style={styles.context}>
          {screening.cinema_name} · {screening.screen_name}
        </Text>
        <Text style={styles.context}>
          {new Intl.DateTimeFormat("en-PH", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(screening.start_time))}
        </Text>
        <View style={styles.screen}>
          <Text style={styles.screenText}>SCREEN</Text>
        </View>
        <View style={styles.legend}>
          <Legend color={colors.success} label="Available" />
          <Legend color={colors.primary} label="Selected" />
          <Legend color="#D28A18" label="Held" />
          <Legend color={colors.muted} label="Occupied / unavailable" />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mapScroller}
        >
          <View style={styles.map}>
            {rows.map(([row, seats]) => (
              <View key={row} style={styles.row}>
                <Text style={styles.rowLabel}>{row}</Text>
                <View style={styles.seats}>
                  {seats.map((seat) => {
                    const active = selected.includes(seat.id);
                    const unavailable = seat.status !== "available";
                    return (
                      <Pressable
                        accessibilityLabel={`${row}${seat.seat_number}, ${unavailable ? seat.status : active ? "selected" : "available"}`}
                        accessibilityRole="button"
                        disabled={unavailable}
                        key={seat.id}
                        onPress={() => toggleSeat(seat)}
                        style={[
                          styles.seat,
                          seat.status === "held" && styles.held,
                          unavailable &&
                            seat.status !== "held" &&
                            styles.unavailable,
                          active && styles.selected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.seatText,
                            (unavailable || active) && styles.seatTextActive,
                          ]}
                        >
                          {seat.seat_number}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>
            {selectedSeats.length
              ? `${selectedSeats.length} seat${selectedSeats.length === 1 ? "" : "s"} selected`
              : "No seats selected"}
          </Text>
          <Text style={styles.summaryCopy}>
            {selectedSeats.length
              ? selectedSeats
                  .map((seat) => `${seat.row_label}${seat.seat_number}`)
                  .join(", ")
              : `Select up to ${inventory.max_seats_per_order} available seats.`}
          </Text>
          <Text style={styles.total}>{formatPrice(total)}</Text>
        </View>
        {selectionError ? (
          <Text style={styles.error}>{selectionError}</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={!selected.length || holding}
          onPress={() => void continueToReview()}
          style={[
            styles.continue,
            (!selected.length || holding) && styles.disabled,
          ]}
        >
          <Text style={styles.continueText}>
            {holding ? "Checking seats…" : "Review selected seats"}
          </Text>
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    color: colors.foreground,
    fontSize: typography.display,
    fontWeight: "800",
    marginTop: spacing.lg,
  },
  context: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  screen: {
    backgroundColor: colors.primaryDeep,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  screenText: {
    color: colors.white,
    fontSize: typography.eyebrow,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  legendItem: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  legendDot: { borderRadius: 4, height: 14, width: 14 },
  legendText: { color: colors.mutedForeground, fontSize: 12 },
  mapScroller: { minWidth: "100%", paddingVertical: spacing.lg },
  map: { alignSelf: "center", gap: spacing.sm },
  row: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  rowLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    width: 16,
  },
  seats: { flexDirection: "row", gap: 6 },
  seat: {
    alignItems: "center",
    backgroundColor: "#BCE6D2",
    borderRadius: 6,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  held: { backgroundColor: "#D28A18" },
  unavailable: { backgroundColor: colors.muted },
  selected: { backgroundColor: colors.primary },
  seatText: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  seatTextActive: { color: colors.white },
  summary: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  summaryTitle: {
    color: colors.foreground,
    fontSize: typography.label,
    fontWeight: "800",
  },
  summaryCopy: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  total: {
    color: colors.primary,
    fontSize: typography.title,
    fontWeight: "800",
    marginTop: spacing.md,
  },
  error: {
    color: colors.destructive,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.md,
  },
  continue: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    marginTop: spacing.lg,
    minHeight: 52,
  },
  disabled: { opacity: 0.55 },
  continueText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "800",
  },
});
