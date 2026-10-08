import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BrandLogo } from "@/components/brand-logo";
import { EventCard } from "@/components/event-card";
import { AppScreen } from "@/components/screen";
import { LoadingState, MessageState } from "@/components/state-view";
import { fetchEvents, type TixEvent } from "@/lib/events";
import { useAuth } from "@/providers/auth-provider";
import { colors, radius, spacing, typography } from "@/theme/tokens";

type HomeData = {
  featured: TixEvent | null;
  movies: TixEvent[];
  concerts: TixEvent[];
  events: TixEvent[];
};

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const goToEvent = (event: TixEvent) =>
    router.push(
      (event.category === "Movies"
        ? `/cinema/${event.slug}`
        : `/events/${event.slug}`) as never,
    );
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [featured, movies, concerts, events] = await Promise.all([
        fetchEvents({ featured: true, limit: 1 }),
        fetchEvents({ category: "Movies" }),
        fetchEvents({ category: "Concerts" }),
        fetchEvents({ category: "Events" }),
      ]);
      setData({
        featured: featured[0] ?? null,
        movies: movies.filter((event) => event.featured),
        concerts,
        events,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  if (loading)
    return (
      <AppScreen>
        <LoadingState label="Finding what’s on in Tixora…" />
      </AppScreen>
    );
  if (error || !data)
    return (
      <AppScreen>
        <MessageState
          title="Couldn’t load Tixora"
          detail="Please check your connection and try again."
          actionLabel="Try again"
          onAction={() => void load()}
        />
      </AppScreen>
    );
  const firstName = session?.user.name.split(" ")[0] ?? "there";
  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <BrandLogo style={styles.logo} />
        </View>
        <Text style={styles.greeting}>Hello, {firstName}.</Text>
        <Text style={styles.subhead}>Your next night out starts here.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/discover" as never)}
          style={styles.search}
        >
          <Text style={styles.searchIcon}>⌕</Text>
          <Text style={styles.searchText}>Search events, venues, artists…</Text>
        </Pressable>
        {data.featured ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => goToEvent(data.featured!)}
            style={styles.hero}
          >
            <Text style={styles.eyebrow}>FEATURED ON TIXORA</Text>
            <Text numberOfLines={2} style={styles.heroTitle}>
              {data.featured.title}
            </Text>
            <Text numberOfLines={2} style={styles.heroCopy}>
              {data.featured.subtitle}
            </Text>
            <Text style={styles.heroAction}>See details →</Text>
          </Pressable>
        ) : (
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>OFFICIAL TICKETING</Text>
            <Text style={styles.heroTitle}>
              Discover live{`\n`}moments near you.
            </Text>
            <Pressable
              onPress={() => router.push("/discover" as never)}
              style={styles.heroButton}
            >
              <Text style={styles.heroButtonText}>Explore events</Text>
            </Pressable>
          </View>
        )}
        <ContentSection
          title="Now Showing movies"
          onViewAll={() => router.push("/cinema" as never)}
          items={data.movies}
          onPress={goToEvent}
          empty="No now showing movies are available yet."
        />
        <ContentSection
          title="Upcoming concerts"
          onViewAll={() => router.push("/discover" as never)}
          items={data.concerts}
          onPress={goToEvent}
          empty="No upcoming concerts are available yet."
        />
        <ContentSection
          title="Upcoming events"
          onViewAll={() => router.push("/discover" as never)}
          items={data.events}
          onPress={goToEvent}
          empty="No upcoming events are available yet."
        />
      </ScrollView>
    </AppScreen>
  );
}

function ContentSection({
  title,
  onViewAll,
  items,
  onPress,
  empty,
}: {
  title: string;
  onViewAll: () => void;
  items: TixEvent[];
  onPress: (event: TixEvent) => void;
  empty: string;
}) {
  return (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHead}>
        <Text style={styles.section}>{title}</Text>
        <Pressable accessibilityRole="button" onPress={onViewAll}>
          <Text style={styles.viewAll}>View all</Text>
        </Pressable>
      </View>
      {items.length ? (
        <View style={styles.list}>
          {items.slice(0, 3).map((event) => (
            <EventCard
              event={event}
              key={event.slug}
              onPress={() => onPress(event)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyCopy}>{empty}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  top: { minHeight: 42, justifyContent: "center" },
  logo: { height: 42, width: 140 },
  greeting: {
    color: colors.foreground,
    fontSize: typography.title,
    fontWeight: "800",
    marginTop: spacing.xl,
  },
  subhead: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    marginTop: spacing.xs,
  },
  search: {
    alignItems: "center",
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 50,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  searchIcon: { color: colors.mutedForeground, fontSize: 24 },
  searchText: { color: colors.mutedForeground, fontSize: typography.label },
  hero: {
    backgroundColor: colors.primaryDeep,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
    overflow: "hidden",
    padding: spacing.lg,
  },
  eyebrow: {
    color: "#FFDADF",
    fontSize: typography.eyebrow,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 35,
    marginTop: spacing.sm,
  },
  heroCopy: {
    color: "#FFDADF",
    fontSize: typography.label,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  heroAction: {
    color: colors.white,
    fontSize: typography.label,
    fontWeight: "800",
    marginTop: spacing.lg,
  },
  heroButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroButtonText: {
    color: colors.primaryDeep,
    fontSize: typography.label,
    fontWeight: "800",
  },
  sectionWrap: { marginTop: spacing.xl },
  sectionHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  section: {
    color: colors.foreground,
    fontSize: typography.title,
    fontWeight: "800",
  },
  viewAll: {
    color: colors.primary,
    fontSize: typography.label,
    fontWeight: "800",
  },
  list: { gap: spacing.md, marginTop: spacing.md },
  empty: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  emptyCopy: { color: colors.mutedForeground, lineHeight: 20 },
});
