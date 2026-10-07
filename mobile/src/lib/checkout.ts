import * as WebBrowser from "expo-web-browser";
export function requestKey() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r & 3) | 8).toString(16);
  });
} // Non-secret idempotency identifier; authorization is always server-side.
export async function openCheckout(url: string) {
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== "checkout.paymongo.com"
  )
    throw new Error("Invalid checkout URL.");
  await WebBrowser.openBrowserAsync(url);
}
