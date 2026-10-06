import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/screen';
import { LoadingState, MessageState } from '@/components/state-view';
import { releaseSeatHold, reviewSeatHold, type BookingReview } from '@/lib/cinema';
import { formatPrice } from '@/lib/events';
import { useAuth } from '@/providers/auth-provider';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function BookingReviewScreen() {
  const router = useRouter(); const { slug, screeningId, hold } = useLocalSearchParams<{ slug: string; screeningId: string; hold: string }>(); const { session } = useAuth();
  const [review, setReview] = useState<BookingReview | null>(null); const [error, setError] = useState(false); const [releasing, setReleasing] = useState(false);
  const load = useCallback(async () => { if (!screeningId || !hold || !session) return; setError(false); try { setReview(await reviewSeatHold(screeningId, hold, session.token)); } catch { setError(true); } }, [hold, screeningId, session]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  async function cancelHold() { if (!session || !hold || releasing) return; setReleasing(true); try { await releaseSeatHold(screeningId, hold, session.token); router.replace(`/cinema/${slug}/screenings/${screeningId}/seats` as never); } finally { setReleasing(false); } }
  if (!review && !error) return <AppScreen><LoadingState label="Validating your selected seats…" /></AppScreen>;
  if (error || !review) return <AppScreen><MessageState title="Your seat hold is no longer active" detail="Seats may have been released or availability changed. Please select seats again." actionLabel="Choose seats" onAction={() => router.replace(`/cinema/${slug}/screenings/${screeningId}/seats` as never)} /></AppScreen>;
  return <AppScreen><ScrollView contentContainerStyle={styles.content}><Text style={styles.eyebrow}>REVIEW YOUR SELECTION</Text><Text style={styles.title}>Seats held for you</Text><Text style={styles.copy}>Your selection has been revalidated by Tixora. Booking confirmation is the next phase and is not available yet.</Text><View style={styles.card}><Text style={styles.movie}>{review.screening.cinema_name} · {review.screening.screen_name}</Text><Text style={styles.meta}>{new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(review.screening.start_time))}</Text><Text style={styles.seats}>{review.seats.map((seat) => `${seat.row_label}${seat.seat_number}`).join(', ')}</Text><Text style={styles.total}>{formatPrice(review.total_amount)}</Text></View><Pressable accessibilityRole="button" disabled={releasing} onPress={() => void cancelHold()} style={styles.cancel}><Text style={styles.cancelText}>{releasing ? 'Releasing seats…' : 'Release selected seats'}</Text></Pressable></ScrollView></AppScreen>;
}
const styles = StyleSheet.create({ content: { padding: spacing.lg, paddingBottom: spacing.xxl }, eyebrow: { color: colors.primary, fontSize: typography.eyebrow, fontWeight: '800', letterSpacing: 1.2 }, title: { color: colors.foreground, fontSize: typography.display, fontWeight: '800', marginTop: spacing.sm }, copy: { color: colors.mutedForeground, fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm }, card: { backgroundColor: colors.secondary, borderRadius: radius.md, marginTop: spacing.xl, padding: spacing.lg }, movie: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' }, meta: { color: colors.mutedForeground, fontSize: typography.label, marginTop: spacing.sm }, seats: { color: colors.foreground, fontSize: typography.label, fontWeight: '700', marginTop: spacing.lg }, total: { color: colors.primary, fontSize: typography.title, fontWeight: '800', marginTop: spacing.md }, cancel: { alignItems: 'center', borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, justifyContent: 'center', marginTop: spacing.lg, minHeight: 52 }, cancelText: { color: colors.foreground, fontSize: typography.body, fontWeight: '800' } });
