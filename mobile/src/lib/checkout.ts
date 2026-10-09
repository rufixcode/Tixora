import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

// Open during the tap, before the booking request, so browsers allow checkout.
export function prepareCheckout() {
  const popup = Platform.OS === "web" ? window.open("", "_blank") : null;
  if (Platform.OS === "web" && !popup)
    throw new Error("Allow pop-ups to open secure payment, then try again.");
  if (popup) {
    popup.opener = null;
    popup.document.title = "Secure payment";
    popup.document.body.textContent = "Preparing secure payment…";
  }
  return {
    open: async (url: string) => {
      validateCheckout(url);
      if (popup) {
        if (popup.closed)
          throw new Error(
            "The payment window was closed. Resume payment from My bookings.",
          );
        popup.location.replace(url);
      } else await openCheckout(url);
    },
    cancel: () => popup?.close(),
  };
}
export function requestKey() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r & 3) | 8).toString(16);
  });
} // Non-secret idempotency identifier; authorization is always server-side.
export async function openCheckout(url: string) {
  validateCheckout(url);
  await WebBrowser.openBrowserAsync(url);
}
function validateCheckout(url: string) {
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== "checkout.paymongo.com"
  )
    throw new Error("Invalid checkout URL.");
}
