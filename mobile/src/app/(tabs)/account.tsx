import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppScreen } from "@/components/screen";
import { MessageState } from "@/components/state-view";
import { apiRequest } from "@/lib/api";
import { formatPrice, type TixEvent } from "@/lib/events";
import { useAuth } from "@/providers/auth-provider";
import { colors, radius, spacing, typography } from "@/theme/tokens";

type Booking = { id: number; event_title: string; booking_reference: string; status: string; total_amount: number; tickets: { ticket_number: string; status: string }[]; seats: { row_label: string; seat_number: number }[] };

export default function AccountScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [saved, setSaved] = useState<TixEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true); setError("");
    try {
      const [bookingData, savedData] = await Promise.all([
        apiRequest<Booking[]>("/bookings", { token: session.token }),
        apiRequest<TixEvent[]>("/favorites", { token: session.token }),
      ]);
      setBookings(bookingData); setSaved(savedData);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load account activity."); }
    finally { setLoading(false); }
  }, [session]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  function openSaved(item: TixEvent) {
    router.push((item.category === "Movies" ? `/cinema/${item.slug}` : `/events/${item.slug}`) as never);
  }
  return <AppScreen><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>TIXORA ACCOUNT</Text><Text style={styles.title}>My Account</Text></View><Pressable accessibilityLabel="Open account settings" accessibilityRole="button" onPress={() => router.push("/settings" as never)} style={styles.settingsButton}><Text style={styles.settingsIcon}>⚙</Text></Pressable></View>
    <View style={styles.identity}><Text style={styles.name}>{session?.user.name}</Text><Text style={styles.email}>{session?.user.email}</Text></View>
    {error ? <MessageState title="Couldn’t load account activity" detail={error} actionLabel="Try again" onAction={() => void load()} /> : <>
      <SectionHeading title="My Bookings & Tickets" action="View all" onPress={() => router.push("/bookings" as never)} />
      {loading ? <Text style={styles.status}>Loading your activity…</Text> : null}
      {!loading && !bookings.length ? <View style={styles.emptyCard}><Text style={styles.emptyTitle}>No tickets or bookings yet.</Text><Text style={styles.emptyCopy}>Your confirmed tickets and pending bookings will appear here.</Text></View> : null}
      {bookings.slice(0, 3).map((booking) => <Pressable accessibilityRole="button" accessibilityLabel={`View booking ${booking.booking_reference}`} key={booking.id} onPress={() => router.push("/bookings" as never)} style={styles.bookingCard}><View style={styles.cardTopline}><Text numberOfLines={1} style={styles.bookingTitle}>{booking.event_title || booking.booking_reference}</Text><Text style={styles.statusPill}>{booking.status}</Text></View><Text style={styles.bookingReference}>{booking.booking_reference}</Text><Text style={styles.bookingMeta}>{formatPrice(booking.total_amount)}{booking.seats.length ? ` · Seats ${booking.seats.map((seat) => `${seat.row_label}${seat.seat_number}`).join(", ")}` : ""}</Text><Text style={styles.openDetails}>View booking details →</Text></Pressable>)}
      <SectionHeading title="Saved" action="View all" onPress={() => router.push("/favorites" as never)} />
      {!loading && !saved.length ? <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Nothing saved yet.</Text><Text style={styles.emptyCopy}>Save a movie, concert, or event to find it here later.</Text></View> : null}
      {saved.slice(0, 3).map((item) => <Pressable accessibilityRole="button" key={item.slug} onPress={() => openSaved(item)} style={styles.savedCard}><View><Text style={styles.savedCategory}>{item.category}</Text><Text numberOfLines={1} style={styles.savedTitle}>{item.title}</Text><Text numberOfLines={1} style={styles.savedMeta}>{item.venue} · {item.date}</Text></View><Text style={styles.savedArrow}>→</Text></Pressable>)}
    </>}
    {session?.user.is_admin ? <Pressable accessibilityRole="button" onPress={() => router.push("/admin" as never)} style={styles.adminLink}><Text style={styles.adminText}>Open admin dashboard</Text></Pressable> : null}
  </ScrollView></AppScreen>;
}
function SectionHeading({ title, action, onPress }: { title: string; action: string; onPress: () => void }) { return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Pressable accessibilityRole="button" onPress={onPress}><Text style={styles.action}>{action}</Text></Pressable></View>; }
const styles = StyleSheet.create({
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: 120 }, header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs }, eyebrow: { color: colors.primary, fontSize: typography.eyebrow, fontWeight: "800", letterSpacing: 1.2 }, title: { color: colors.foreground, fontSize: 28, fontWeight: "800", marginTop: spacing.xs }, settingsButton: { alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: radius.pill, height: 44, justifyContent: "center", width: 44 }, settingsIcon: { color: colors.primary, fontSize: 22 }, identity: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.md }, name: { color: colors.foreground, fontSize: typography.title, fontWeight: "800" }, email: { color: colors.mutedForeground, fontSize: typography.label, marginTop: spacing.xs }, sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md }, sectionTitle: { color: colors.foreground, fontSize: typography.title, fontWeight: "800" }, action: { color: colors.primary, fontSize: typography.label, fontWeight: "800" }, status: { color: colors.mutedForeground, fontSize: typography.label }, emptyCard: { backgroundColor: colors.secondary, borderRadius: radius.md, padding: spacing.md }, emptyTitle: { color: colors.foreground, fontSize: typography.body, fontWeight: "800" }, emptyCopy: { color: colors.mutedForeground, fontSize: typography.label, lineHeight: 19, marginTop: spacing.xs }, bookingCard: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, padding: spacing.md }, cardTopline: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" }, bookingTitle: { color: colors.foreground, flex: 1, fontSize: typography.body, fontWeight: "800" }, statusPill: { color: colors.primary, fontSize: 12, fontWeight: "800", textTransform: "uppercase" }, bookingReference: { color: colors.mutedForeground, fontSize: 12, marginTop: spacing.xs }, bookingMeta: { color: colors.foreground, fontSize: typography.label, marginTop: spacing.sm }, openDetails: { color: colors.primary, fontSize: typography.label, fontWeight: "800", marginTop: spacing.md }, savedCard: { alignItems: "center", backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: spacing.md }, savedCategory: { color: colors.primary, fontSize: 12, fontWeight: "800", textTransform: "uppercase" }, savedTitle: { color: colors.foreground, fontSize: typography.body, fontWeight: "800", marginTop: 2 }, savedMeta: { color: colors.mutedForeground, fontSize: 13, marginTop: 2 }, savedArrow: { color: colors.primary, fontSize: 22, fontWeight: "800" }, adminLink: { alignItems: "center", borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.md, padding: spacing.md }, adminText: { color: colors.foreground, fontSize: typography.label, fontWeight: "800" },
});
