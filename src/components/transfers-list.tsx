import Link from "next/link";
import { formatFee, formatMonthDay } from "@/lib/format";
import type { Transfer } from "@/lib/types";
import { ArrowRightIcon } from "./icons";
import { Crest } from "./ui";

function TransferRow({ transfer }: { transfer: Transfer }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Crest id={transfer.fromClubId} name={transfer.fromClub} size={26} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/player/${transfer.playerId}`}
            className="block truncate text-[13px] font-semibold text-ink transition-colors hover:text-accent"
          >
            {transfer.name}
          </Link>
          <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-dim">
            <span className="truncate">{transfer.fromClubFullName ?? transfer.fromClub}</span>
            <ArrowRightIcon size={10} className="shrink-0" />
            <span className="truncate">{transfer.toClubFullName ?? transfer.toClub}</span>
          </span>
        </div>
        <Crest id={transfer.toClubId} name={transfer.toClub} size={26} />
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[11px] font-bold text-ink">{formatFee(transfer.fee, transfer.amountEuroEstimated)}</div>
        <div className="text-[10px] text-dim">
          {transfer.transferDate ? formatMonthDay(transfer.transferDate) : transfer.transferType?.text ?? ""}
        </div>
      </div>
    </div>
  );
}

export function TransfersList({
  transfers,
  teamId,
  limit,
  emptyLabel = "No transfers recorded.",
}: {
  transfers?: Transfer[];
  teamId?: number;
  limit?: number;
  emptyLabel?: string;
}) {
  const list = (transfers ?? []).filter((transfer) => {
    if (!teamId) return true;
    return transfer.fromClubId === teamId || transfer.toClubId === teamId;
  });

  if (list.length === 0) {
    return <div className="card px-4 py-10 text-center text-sm text-dim">{emptyLabel}</div>;
  }

  if (teamId) {
    const arrivals = list.filter((transfer) => transfer.toClubId === teamId);
    const departures = list.filter((transfer) => transfer.fromClubId === teamId);
    return (
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line/60 bg-white/[0.014] px-3.5 py-2.5">
            <h3 className="text-xs font-bold text-ink">Arrivals</h3>
            <span className="text-[10px] text-dim">{arrivals.length}</span>
          </div>
          <div className="divide-y divide-line/40">
            {(limit ? arrivals.slice(0, limit) : arrivals).map((transfer) => (
              <TransferRow key={`in-${transfer.playerId}-${transfer.transferDate ?? ""}`} transfer={transfer} />
            ))}
            {arrivals.length === 0 && (
              <p className="px-4 py-5 text-xs text-dim">No arrivals recorded.</p>
            )}
          </div>
        </section>
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line/60 bg-white/[0.014] px-3.5 py-2.5">
            <h3 className="text-xs font-bold text-ink">Departures</h3>
            <span className="text-[10px] text-dim">{departures.length}</span>
          </div>
          <div className="divide-y divide-line/40">
            {(limit ? departures.slice(0, limit) : departures).map((transfer) => (
              <TransferRow key={`out-${transfer.playerId}-${transfer.transferDate ?? ""}`} transfer={transfer} />
            ))}
            {departures.length === 0 && (
              <p className="px-4 py-5 text-xs text-dim">No departures recorded.</p>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="divide-y divide-line/40">
        {(limit ? list.slice(0, limit) : list).map((transfer) => (
          <TransferRow
            key={`${transfer.playerId}-${transfer.fromClubId}-${transfer.toClubId}-${transfer.transferDate ?? ""}`}
            transfer={transfer}
          />
        ))}
      </div>
    </div>
  );
}
