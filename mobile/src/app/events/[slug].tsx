import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { EventDetails } from '@/components/event-details';
import { AppScreen } from '@/components/screen';
import { LoadingState, MessageState } from '@/components/state-view';
import { getEvent, type TixEvent } from '@/lib/events';

export default function EventDetailScreen() {
  const router = useRouter(); const { slug } = useLocalSearchParams<{ slug: string }>();
  const [event, setEvent] = useState<TixEvent | null | undefined>(undefined); const [error, setError] = useState(false);
  const load = useCallback(async () => { if (!slug) return; setError(false); try { setEvent(await getEvent(slug)); } catch { setError(true); } }, [slug]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  if (event === undefined && !error) return <AppScreen><LoadingState label="Loading event…" /></AppScreen>;
  if (error) return <AppScreen><MessageState title="Couldn’t load this event" detail="Please check your connection and try again." actionLabel="Try again" onAction={() => void load()} /></AppScreen>;
  if (!event) return <AppScreen><MessageState title="Event not found" detail="This event may no longer be available." actionLabel="Browse events" onAction={() => router.replace('/discover' as never)} /></AppScreen>;
  return <EventDetails event={event} onBack={() => router.back()} />;
}
