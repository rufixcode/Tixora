// Only event detail routes may be used as a post-login destination.
export function eventSlugFromNext(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return /^\/events\/([a-z0-9-]+)$/.exec(value)?.[1];
}

export function loginSearch(search: Record<string, unknown>): { next?: string | undefined } {
  const slug = eventSlugFromNext(search["next"]);
  return slug ? { next: `/events/${slug}` } : {};
}
