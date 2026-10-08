import { useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
export type ChatAction = { label: string; route: string; slug?: string };
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  actions?: ChatAction[];
  mode?: "ai" | "guide";
};
export function useAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  async function send(question = input) {
    const message = question.trim();
    if (!message || pending.current || message.length > 1000) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setInput("");
    const history = messages
      .slice(-6)
      .map(({ role, content }) => ({ role, content: content.slice(0, 1500) }));
    setMessages((prev) => [
      ...prev.slice(-18),
      { role: "user", content: message },
    ]);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);
    try {
      const response = await apiRequest<{
        reply: string;
        mode: "ai" | "guide";
        actions: ChatAction[];
      }>("/assistant/chat", {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({ message, history }),
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.reply,
          actions: response.actions,
          mode: response.mode,
        },
      ]);
    } catch (e) {
      setError(
        e instanceof Error && e.name === "AbortError"
          ? "The assistant took too long. Please try again."
          : (e as Error).message,
      );
      setInput(message);
    } finally {
      clearTimeout(timeout);
      pending.current = false;
      setBusy(false);
    }
  }
  function clear() {
    if (!pending.current) {
      setMessages([]);
      setError("");
      setInput("");
    }
  }
  return { messages, input, setInput, busy, error, send, clear };
}
export function safeChatPath(
  action: ChatAction,
  mobile = false,
): string | null {
  const routes: Record<string, string> = {
    events: mobile ? "/discover" : "/events",
    bookings: "/bookings",
    favorites: "/favorites",
    settings: "/settings",
    login: "/login",
  };
  if (
    action.route === "event" &&
    action.slug &&
    /^[a-z0-9-]+$/.test(action.slug)
  )
    return `/events/${action.slug}`;
  return Object.prototype.hasOwnProperty.call(routes, action.route)
    ? routes[action.route]!
    : null;
}
