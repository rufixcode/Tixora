import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TixEvent } from '@/lib/events';
import { formatPrice } from '@/lib/events';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export function EventCard({ event, onPress }: { event: TixEvent; onPress?: () => void }) {
  const lowest = Math.min(...event.tiers.map((tier) => tier.price));
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}><View style={[styles.poster, { backgroundColor: event.category === 'Movies' ? '#E9E6F8' : event.category === 'Concerts' ? '#FCE7EA' : '#E4F1EF' }]}><Text style={styles.posterText}>{event.category === 'Movies' ? 'FILM' : event.category === 'Concerts' ? 'LIVE' : 'EVENT'}</Text></View><View style={styles.content}><Text style={styles.category}>{event.category}</Text><Text numberOfLines={2} style={styles.title}>{event.title}</Text><Text numberOfLines={1} style={styles.meta}>{event.venue} · {event.date}</Text><Text style={styles.price}>{Number.isFinite(lowest) ? `From ${formatPrice(lowest)}` : 'Pricing coming soon'}</Text></View></Pressable>;
}
const styles = StyleSheet.create({ card: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, overflow: 'hidden', padding: spacing.sm }, pressed: { backgroundColor: colors.primarySoft }, poster: { alignItems: 'center', borderRadius: radius.sm, height: 86, justifyContent: 'center', width: 76 }, posterText: { color: colors.ink, fontSize: typography.eyebrow, fontWeight: '900', letterSpacing: 1 }, content: { flex: 1, justifyContent: 'center' }, category: { color: colors.primary, fontSize: typography.eyebrow, fontWeight: '800', letterSpacing: 1 }, title: { color: colors.foreground, fontSize: typography.body, fontWeight: '800', marginTop: spacing.xs }, meta: { color: colors.mutedForeground, fontSize: 13, marginTop: spacing.xs }, price: { color: colors.foreground, fontSize: 13, fontWeight: '800', marginTop: spacing.sm } });
