import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Text } from "react-native";
import { CheckoutReview } from "@/components/checkout-review";
import { AppScreen } from "@/components/screen";
import { LoadingState, MessageState } from "@/components/state-view";
import { getEvent, type TixEvent } from "@/lib/events";
import { apiRequest } from "@/lib/api";
import { prepareCheckout, requestKey } from "@/lib/checkout";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme/tokens";

export default function EventCheckout() {
  const params = useLocalSearchParams<{
    slug: string;
    tier: string;
    quantity: string;
  }>();
  return (
    <Order
      key={`${params.slug}:${params.tier}:${params.quantity}`}
      {...params}
    />
  );
}
function Order({
  slug,
  tier,
  quantity,
}: {
  slug: string;
  tier: string;
  quantity: string;
}) {
  const router = useRouter();
  const { session } = useAuth();
  const [event, setEvent] = useState<TixEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key = useRef<string | null>(null);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    getEvent(slug)
      .then((data) => {
        if (active) setEvent(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);
  const ticket = event?.tiers.find((t) => t.id === tier);
  const count = Number(quantity);
  const valid =
    !!ticket &&
    !!event?.booking_available &&
    Number.isInteger(count) &&
    count >= 1 &&
    count <= 8 &&
    count <= ticket.remaining;
  async function pay() {
    if (!session || !valid || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    let checkout: ReturnType<typeof prepareCheckout> | undefined;
    try {
      checkout = prepareCheckout();
      key.current ??= requestKey();
      const result = await apiRequest<{ checkout_url: string }>(
        `/events/${encodeURIComponent(slug)}/bookings`,
        {
          method: "POST",
          token: session.token,
          body: JSON.stringify({
            ticket_type_id: tier,
            quantity: count,
            request_key: key.current,
          }),
        },
      );
      await checkout.open(result.checkout_url);
      router.replace("/bookings" as never);
    } catch (e) {
      checkout?.cancel();
      setError(
        `${(e as Error).message} Check My bookings before starting another order.`,
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (!session)
    return (
      <AppScreen>
        <MessageState
          title="Sign in to continue"
          detail="Sign in to reserve tickets and pay securely."
          actionLabel="Sign in"
          onAction={() => router.replace("/login" as never)}
        />
      </AppScreen>
    );
  if (loading)
    return (
      <AppScreen>
        <LoadingState label="Checking ticket availability…" />
      </AppScreen>
    );
  if (!event || !ticket || !valid)
    return (
      <AppScreen>
        <MessageState
          title="Tickets unavailable"
          detail={error || "Choose an available ticket and quantity again."}
          actionLabel="Back to event"
          onAction={() => router.replace(`/events/${slug}` as never)}
        />
      </AppScreen>
    );
  return (
    <CheckoutReview
      total={ticket.price * count}
      quantity={count}
      unitPrice={ticket.price}
      busy={busy}
      error={error}
      onPay={() => void pay()}
      onChange={() => router.back()}
    >
      <Text
        style={{ color: colors.foreground, fontWeight: "800", fontSize: 18 }}
      >
        {event.title}
      </Text>
      <Text style={{ color: colors.mutedForeground }}>
        {event.venue} · {event.city}
      </Text>
      <Text style={{ color: colors.mutedForeground }}>
        {event.date} · {event.time}
      </Text>
      <Text style={{ color: colors.primary, fontWeight: "700" }}>
        {ticket.name} · {count} {count === 1 ? "ticket" : "tickets"}
      </Text>
    </CheckoutReview>
  );
}
