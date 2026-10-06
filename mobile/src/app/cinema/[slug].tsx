import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { EventDetails } from '@/components/event-details';
import { AppScreen } from '@/components/screen';
import { LoadingState, MessageState } from '@/components/state-view';
import { getEvent, type TixEvent } from '@/lib/events';

export default function MovieDetailScreen() {
  const router = useRouter(); const { slug } = useLocalSearchParams<{ slug: string }>();
  const [movie, setMovie] = useState<TixEvent | null | undefined>(undefined); const [error, setError] = useState(false);
  const load = useCallback(async () => { if (!slug) return; setError(false); try { setMovie(await getEvent(slug)); } catch { setError(true); } }, [slug]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  if (movie === undefined && !error) return <AppScreen><LoadingState label="Loading movie…" /></AppScreen>;
  if (error) return <AppScreen><MessageState title="Couldn’t load this movie" detail="Please check your connection and try again." actionLabel="Try again" onAction={() => void load()} /></AppScreen>;
  if (!movie || movie.category !== 'Movies') return <AppScreen><MessageState title="Movie not found" detail="This movie may no longer be available." actionLabel="Browse cinema" onAction={() => router.replace('/cinema' as never)} /></AppScreen>;
  return <EventDetails event={movie} onBack={() => router.back()} actionLabel="View available screening" onAction={() => router.push(`/cinema/${movie.slug}/screenings` as never)} />;
}
