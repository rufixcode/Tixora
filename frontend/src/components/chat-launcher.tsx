import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
export function ChatLauncher() {
  const [open, setOpen] = useState(false);
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
          className="mb-2 w-[min(340px,calc(100vw-40px))] rounded-2xl p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Tixora assistant</h2>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Coming soon. The AI assistant is not connected yet. No messages are collected or sent.
          </p>
          <input
            aria-label="Chat unavailable"
            disabled
            placeholder="Chat will be available soon"
            className="mt-5 w-full rounded-lg border bg-muted p-3 text-sm"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
