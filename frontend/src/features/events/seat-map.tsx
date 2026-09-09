import type { TixEvent } from "@/lib/events";
import { formatPrice } from "@/lib/events";

export type SeatSelection = { id: string; label: string; price: number; zone: string };

const ROW_LETTERS = "ABCDEFGHJKLMNPQRS".split("");

function isTaken(id: string) {
  let hash = 7;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % 9973;
  return hash % 6 === 0;
}

type SeatMapProps = {
  event: TixEvent;
  selected: SeatSelection[];
  onToggle: (seat: SeatSelection) => void;
  maxSeats?: number;
};

export function SeatMap({ event, selected, onToggle, maxSeats = 8 }: SeatMapProps) {
  const kind = event.seating ?? "cinema";
  const selectedIds = new Set(selected.map((seat) => seat.id));
  const zones = event.tiers.filter((tier) => tier.seatZone);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
      <div className="mb-6 flex items-center justify-center">
        <div className="w-full max-w-md rounded-b-[3rem] bg-gradient-primary px-6 py-2.5 text-center">
          <span className="eyebrow text-primary-foreground">
            {kind === "cinema" ? "Screen" : "Stage"}
          </span>
        </div>
      </div>

      <div className="space-y-7 overflow-x-auto pb-2">
        {zones.map((tier, zoneIndex) => {
          const zone = tier.seatZone!;
          const rows = Array.from({ length: zone.rows }, (_, i) => ROW_LETTERS[(zone.rowOffset ?? 0) + i] ?? "Z");
          return (
            <div key={tier.id}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-bold">{tier.name}</p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {formatPrice(tier.price)} / seat
                </p>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                {rows.map((row, rowIndex) => {
                  const curve = kind === "arena" ? Math.abs(rowIndex - (zone.rows - 1) / 2) * 6 : 0;
                  return (
                    <div
                      key={row}
                      className="flex items-center gap-1.5"
                      style={{ paddingInline: `${curve}px` }}
                    >
                      <span className="w-4 shrink-0 text-[10px] font-bold text-muted-foreground">
                        {row}
                      </span>
                      {Array.from({ length: zone.seatsPerRow }, (_, seatIndex) => {
                        const number = seatIndex + 1;
                        const id = `${tier.id}-${row}${number}`;
                        const label = `${tier.name.split(" ")[0]} ${row}${number}`;
                        const taken = isTaken(id);
                        const isSelected = selectedIds.has(id);
                        const gapAfter =
                          kind === "cinema" && number === Math.floor(zone.seatsPerRow / 2);
                        return (
                          <button
                            key={id}
                            type="button"
                            disabled={taken || (!isSelected && selected.length >= maxSeats)}
                            onClick={() => onToggle({ id, label, price: tier.price, zone: tier.name })}
                            aria-label={`${label} — ${taken ? "unavailable" : formatPrice(tier.price)}`}
                            aria-pressed={isSelected}
                            title={`${row}${number} · ${formatPrice(tier.price)}`}
                            className={`size-5 shrink-0 rounded-[4px] text-[9px] font-bold transition-all sm:size-6 ${
                              gapAfter ? "mr-4" : ""
                            } ${
                              taken
                                ? "cursor-not-allowed bg-muted text-muted-foreground/50"
                                : isSelected
                                  ? "scale-110 bg-primary text-primary-foreground shadow-glow"
                                  : zoneIndex === 0
                                    ? "bg-teal/35 text-ink hover:bg-teal/60"
                                    : zoneIndex === 1
                                      ? "bg-primary/25 text-ink hover:bg-primary/45"
                                      : "bg-coral/25 text-ink hover:bg-coral/45"
                            } disabled:opacity-60`}
                          >
                            <span className="sr-only sm:not-sr-only">{number}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-primary/25" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-primary" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-muted" /> Taken
        </span>
        <span className="ml-auto">Up to {maxSeats} seats per order</span>
      </div>
    </div>
  );
}
