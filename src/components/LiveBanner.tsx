import { Flag } from "@/components/Flag";
import type { MatchCardData } from "@/components/MatchCard";

/** Bandeau « EN DIRECT » en haut de l'accueil : les matchs en cours + leur score. */
export function LiveBanner({ matches }: { matches: MatchCardData[] }) {
  if (matches.length === 0) return null;
  return (
    <div className="px-4 pt-4">
      <div className="rounded-2xl border border-[#ff3b30]/40 bg-surface shadow-card p-3.5">
        <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#ff3b30]">
          <span className="h-2 w-2 rounded-full bg-[#ff3b30] animate-pulse" /> En direct
        </div>
        <div className="space-y-2.5">
          {matches.map((m) => (
            <div key={m.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[14px]">
              <span className="flex min-w-0 items-center gap-2">
                <Flag code={m.team_a_code} size={18} />
                <span className="truncate font-semibold">{m.team_a}</span>
              </span>
              <span className="shrink-0 tabular-nums text-base font-bold">
                {m.score_a ?? 0} – {m.score_b ?? 0}
              </span>
              <span className="flex min-w-0 items-center justify-end gap-2">
                <span className="truncate text-right font-semibold">{m.team_b}</span>
                <Flag code={m.team_b_code} size={18} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
