"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";
import { Flag } from "@/components/Flag";
import { computePoints, outcomeOf, qualifierBonus } from "@/lib/scoring";

type Res = {
  matchNo: number;
  kickoff: string;
  teamA: string;
  codeA: string | null;
  teamB: string;
  codeB: string | null;
  realA: number | null;
  realB: number | null;
  status: string;
  predA: number;
  predB: number;
  joker: boolean;
  pts: number;
  outcome: string;
  qualWon: boolean;
};

/** Détail d'un joueur : tous ses matchs joués, son prono, ses points (joker inclus). */
export function PlayerDetail({
  userId,
  name,
  avatarUrl,
  onClose,
}: {
  userId: string;
  name: string;
  avatarUrl: string | null;
  onClose: () => void;
}) {
  const [res, setRes] = useState<Res[] | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("predictions")
        .select(
          "pred_a, pred_b, joker, pred_qualifier, matches(match_no, team_a, team_a_code, team_b, team_b_code, score_a, score_b, status, kickoff, qualified)"
        )
        .eq("user_id", userId);
      const list: Res[] = (data ?? [])
        .map((p) => {
          const row = p as unknown as {
            pred_a: number;
            pred_b: number;
            joker: boolean;
            pred_qualifier: string | null;
            matches: {
              match_no: number;
              team_a: string;
              team_a_code: string | null;
              team_b: string;
              team_b_code: string | null;
              score_a: number | null;
              score_b: number | null;
              status: string;
              kickoff: string;
              qualified: string | null;
            } | null;
          };
          const mm = row.matches;
          if (!mm) return null;
          const finished = mm.status === "finished";
          const base = finished ? computePoints(row.pred_a, row.pred_b, mm.score_a, mm.score_b) : 0;
          const qb = finished ? qualifierBonus(row.pred_qualifier, mm.qualified) : 0;
          return {
            matchNo: mm.match_no,
            kickoff: mm.kickoff,
            teamA: mm.team_a,
            codeA: mm.team_a_code,
            teamB: mm.team_b,
            codeB: mm.team_b_code,
            realA: mm.score_a,
            realB: mm.score_b,
            status: mm.status,
            predA: row.pred_a,
            predB: row.pred_b,
            joker: row.joker,
            pts: (base + qb) * (row.joker ? 2 : 1),
            outcome: finished ? outcomeOf(row.pred_a, row.pred_b, mm.score_a, mm.score_b) : "pending",
            qualWon: qb > 0,
          } as Res;
        })
        .filter((r): r is Res => r != null && new Date(r.kickoff) <= new Date())
        .sort((a, b) => b.kickoff.localeCompare(a.kickoff));
      setRes(list);
    })();
  }, [userId]);

  const total = (res ?? []).reduce((s, r) => s + r.pts, 0);
  const exacts = (res ?? []).filter((r) => r.outcome === "exact").length;
  const bons = (res ?? []).filter((r) => r.outcome === "correct").length;

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-surface p-5 shadow-float sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <Avatar url={avatarUrl} name={name} size={48} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold">{name}</p>
            <p className="text-[13px] text-muted">
              {total} pts (matchs) · {exacts} exact{exacts > 1 ? "s" : ""} · {bons} bon{bons > 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-muted">
            <X size={16} />
          </button>
        </div>

        {res === null ? (
          <p className="py-8 text-center text-muted">Chargement…</p>
        ) : res.length === 0 ? (
          <p className="py-8 text-center text-muted">Aucun match joué pour l&apos;instant.</p>
        ) : (
          <div className="space-y-2">
            {res.map((r) => (
              <div key={r.matchNo} className="rounded-2xl border border-border bg-surface-2 p-3">
                <div className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <Flag code={r.codeA} size={16} />
                    <span className="truncate">{r.teamA}</span>
                  </span>
                  <span className="shrink-0 tabular-nums font-bold">
                    {r.realA ?? "–"} – {r.realB ?? "–"}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                    <span className="truncate text-right">{r.teamB}</span>
                    <Flag code={r.codeB} size={16} />
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[12px] text-muted">
                  <span>
                    Prono : <b className="text-text">{r.predA}–{r.predB}</b>
                    {r.joker && <span className="ml-1 font-semibold text-warning">🃏 ×2</span>}
                  </span>
                  {r.status === "finished" ? (
                    <span className={`font-semibold ${r.pts > 0 ? "text-success" : "text-muted"}`}>
                      +{r.pts}
                      {r.outcome === "exact" ? " · exact" : r.outcome === "correct" ? " · bon" : ""}
                      {r.qualWon ? " · 🎯 qualifié" : ""}
                    </span>
                  ) : (
                    <span className="font-semibold text-[#ff3b30]">en cours</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
