import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { BackButton } from "@/components/back-button";
import { EventCard } from "@/components/event-card";
import { AppScreen } from "@/components/screen";
import { LoadingState, MessageState } from "@/components/state-view";
import { fetchEvents, type TixEvent } from "@/lib/events";
import { colors, spacing, typography } from "@/theme/tokens";

export default function CinemaScreen() {
  const router = useRouter();
  const [movies, setMovies] = useState<TixEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setMovies(await fetchEvents({ category: "Movies" }));
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
        <LoadingState label="Loading movies…" />
      </AppScreen>
    );
  if (error)
    return (
      <AppScreen>
        <MessageState
          title="Couldn’t load movies"
          detail="Make sure the Tixora API is available, then try again."
          actionLabel="Try again"
          onAction={() => void load()}
        />
      </AppScreen>
    );
  return (
    <AppScreen>
      <FlatList
        data={movies}
        keyExtractor={(movie) => movie.slug}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListHeaderComponent={
          <>
            <BackButton
              label="Back to Discover"
              onPress={() => router.back()}
            />
            <Text style={styles.title}>Cinema</Text>
            <Text style={styles.copy}>
              Browse movies and view real available showtimes.
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No movies available yet</Text>
            <Text style={styles.emptyCopy}>
              Check again when the cinema catalog has been updated.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => router.push(`/cinema/${item.slug}` as never)}
          />
        )}
      />
    </AppScreen>
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
  copy: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  empty: {
    backgroundColor: colors.secondary,
    borderRadius: 14,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: typography.body,
    fontWeight: "800",
  },
  emptyCopy: {
    color: colors.mutedForeground,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
});
