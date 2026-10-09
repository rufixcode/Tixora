import { EventActions } from "@/components/event-actions";
import { PosterImage } from "@/components/poster-image";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { BackButton } from "@/components/back-button";
import { AppScreen } from "@/components/screen";
import { formatPrice, type TixEvent } from "@/lib/events";
import { colors, radius, spacing, typography } from "@/theme/tokens";

export function EventDetails({
  event,
  onBack,
}: {
  event: TixEvent;
  onBack: () => void;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BackButton label="Back" onPress={onBack} />
        <View
          style={[
            styles.artwork,
            event.category === "Movies"
              ? styles.movieArtwork
              : event.category === "Concerts"
                ? styles.concertArtwork
                : styles.eventArtwork,
          ]}
        >
          {event.image ? (
            <PosterImage
              title={event.title}
              uri={event.image}
              style={styles.image}
            />
          ) : (
            <Text style={styles.artworkLabel}>
              {event.category.toUpperCase()}
            </Text>
          )}
        </View>
        <Text style={styles.category}>{event.category}</Text>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.subtitle}>{event.subtitle}</Text>
        <View style={styles.metaCard}>
          <Meta label="Venue" value={`${event.venue}, ${event.city}`} />
          <Meta label="Date" value={event.date} />
          <Meta label="Time" value={event.time} />
        </View>
        <Text style={styles.heading}>About</Text>
        <Text style={styles.about}>{event.about}</Text>
        <Text style={styles.heading}>
          {event.category === "Movies"
            ? "Screening information"
            : "Ticket options"}
        </Text>
        <View style={styles.tierList}>
          {event.tiers.map((tier) => (
            <View key={tier.id} style={styles.tier}>
              <View style={styles.tierCopy}>
                <Text style={styles.tierName}>{tier.name}</Text>
                <Text style={styles.tierNote}>{tier.note}</Text>
              </View>
              <Text style={styles.price}>{formatPrice(tier.price)}</Text>
            </View>
          ))}
        </View>
        <EventActions event={event} />
      </ScrollView>
    </AppScreen>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  artwork: {
    alignItems: "center",
    borderRadius: radius.lg,
    height: 230,
    justifyContent: "center",
    marginTop: spacing.lg,
    overflow: "hidden",
  },
  movieArtwork: { backgroundColor: "#E9E6F8" },
  concertArtwork: { backgroundColor: "#FCE7EA" },
  eventArtwork: { backgroundColor: "#E4F1EF" },
  image: { height: "100%", width: "100%" },
  artworkLabel: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: "900",
    letterSpacing: 2,
  },
  category: {
    color: colors.primary,
    fontSize: typography.eyebrow,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: spacing.lg,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.display,
    fontWeight: "800",
    lineHeight: 38,
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  metaCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  meta: { gap: spacing.xs },
  metaLabel: {
    color: colors.mutedForeground,
    fontSize: typography.eyebrow,
    fontWeight: "800",
    letterSpacing: 1,
  },
  metaValue: {
    color: colors.foreground,
    fontSize: typography.label,
    fontWeight: "700",
  },
  heading: {
    color: colors.foreground,
    fontSize: typography.title,
    fontWeight: "800",
    marginTop: spacing.xl,
  },
  about: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  tierList: { gap: spacing.sm, marginTop: spacing.md },
  tier: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md,
  },
  tierCopy: { flex: 1 },
  tierName: {
    color: colors.foreground,
    fontSize: typography.label,
    fontWeight: "800",
  },
  tierNote: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  price: {
    color: colors.primary,
    fontSize: typography.label,
    fontWeight: "800",
  },
  notice: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.lg,
    textAlign: "center",
  },
});
