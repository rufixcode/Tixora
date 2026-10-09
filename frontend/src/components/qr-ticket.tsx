import qrcode from "qrcode-generator";
import { useMemo, useState } from "react";
import { Ticket, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type IssuedTicket = {
  ticket_number: string;
  status: string;
  qr_payload: string | null;
  seat: { row_label: string; seat_number: number } | null;
};

export function QrTicket({
  ticket,
  title,
  reference,
}: {
  ticket: IssuedTicket;
  title: string;
  reference: string;
}) {
  const [copied, setCopied] = useState(false);
  const qr = useMemo(() => {
    if (!ticket.qr_payload) return null;
    const code = qrcode(0, "M");
    code.addData(ticket.qr_payload, "Byte");
    code.make();
    const count = code.getModuleCount();
    let path = "";
    for (let row = 0; row < count; row++)
      for (let col = 0; col < count; col++)
        if (code.isDark(row, col)) path += `M${col + 4},${row + 4}h1v1h-1z `;
    return { path, size: count + 8 };
  }, [ticket.qr_payload]);
  return (
    <section
      aria-label={`Ticket ${ticket.ticket_number}`}
      className="overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-sm"
    >
      <div className="flex items-center justify-between bg-primary px-5 py-3 text-primary-foreground">
        <span className="flex items-center gap-2 font-display font-bold">
          <Ticket size={19} /> TIXORA
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest">Admission pass</span>
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-bold">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">Booking {reference}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 font-semibold text-primary">
            <CheckCircle2 size={14} />
            {ticket.status === "valid"
              ? "Ready for entry"
              : ticket.status === "used"
                ? "Already used"
                : "Unavailable"}
          </span>
          {ticket.seat && (
            <span className="font-semibold">
              Seat {ticket.seat.row_label}
              {ticket.seat.seat_number}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center gap-3 border-t border-dashed border-primary/25 px-5 py-5">
        {qr && (
          <svg
            role="img"
            aria-label="Admission QR code"
            width="220"
            height="220"
            viewBox={`0 0 ${qr.size} ${qr.size}`}
            shapeRendering="crispEdges"
          >
            <rect width={qr.size} height={qr.size} fill="#fff" />
            <path d={qr.path} fill="#17131A" />
          </svg>
        )}
        <p className="break-all text-center font-mono text-xs font-semibold">
          {ticket.ticket_number}
        </p>
        <p className="text-center text-xs text-muted-foreground">
          {qr
            ? "Present this QR at entry. Keep your ticket private."
            : "This pass cannot be used for entry."}
        </p>
        {ticket.qr_payload && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(ticket.qr_payload!);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Entry code copied" : "Copy entry code"}
          </Button>
        )}
      </div>
    </section>
  );
}
