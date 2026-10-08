import { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { safeChatPath, useAssistant } from "@/lib/assistant";
export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const chat = useAssistant();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) end.current?.scrollIntoView({ block: "nearest" });
  }, [chat.messages, chat.busy, open]);
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button aria-label="Open Tixora assistant" className="h-14 rounded-full px-5 shadow-lg">
            <MessageCircle className="mr-2 size-5" />
            Chat
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          className="mb-2 flex max-h-[min(650px,80dvh)] w-[min(390px,calc(100vw-40px))] flex-col rounded-2xl p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold">Tixora assistant</h2>
            <Button type="button" variant="ghost" disabled={chat.busy} onClick={chat.clear}>
              Clear
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Ask about events or how to use Tixora. AI answers may be inaccurate; check the event
            page. Don't share passwords or payment details. Chat stays in memory until cleared or
            reloaded.
          </p>
          <div
            role="log"
            aria-live="polite"
            aria-label="Chat conversation"
            className="min-h-0 flex-1 space-y-3 overflow-y-auto"
          >
            {chat.messages.length === 0 && (
              <>
                <p className="text-sm">How can I help you?</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Find events",
                    "How do I book tickets?",
                    "Help with payment",
                    "Where are my saved events?",
                  ].map((q) => (
                    <Button size="sm" variant="outline" key={q} onClick={() => void chat.send(q)}>
                      {q}
                    </Button>
                  ))}
                </div>
              </>
            )}
            {chat.messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl p-3 text-sm ${m.role === "user" ? "ml-6 bg-primary text-primary-foreground" : "mr-2 bg-muted"}`}
              >
                <p className="mb-1 text-xs font-semibold">
                  {m.role === "user"
                    ? "You"
                    : m.mode === "ai"
                      ? "AI assistant"
                      : "Help guide (AI unavailable)"}
                </p>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                {m.actions && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.actions.map((action, n) => {
                      const path = safeChatPath(action);
                      return path ? (
                        <a
                          key={n}
                          href={path}
                          className="rounded-md border bg-background px-2 py-1 text-foreground underline"
                        >
                          {action.label}
                        </a>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ))}
            {chat.busy && (
              <p role="status" className="text-sm">
                Thinking…
              </p>
            )}
            <div ref={end} />
          </div>
          {chat.error && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {chat.error}
            </p>
          )}
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void chat.send();
            }}
          >
            <input
              aria-label="Message to Tixora assistant"
              placeholder="Ask a question…"
              maxLength={1000}
              value={chat.input}
              onChange={(e) => chat.setInput(e.target.value)}
              disabled={chat.busy}
              className="min-w-0 flex-1 rounded-lg border bg-background p-2 text-sm"
            />
            <Button disabled={chat.busy || !chat.input.trim()}>Send</Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
