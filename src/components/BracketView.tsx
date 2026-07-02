"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TZ } from "@/lib/utils";
import { displayResult } from "@/lib/scoring";

export type BracketMatch = {
  stage: string; // r32 | r16 | qf | sf | final | third
  match_no: number | null;
  team_a: string;
  team_a_code: string | null;
  team_b: string;
  team_b_code: string | null;
  score_a: number | null;
  score_b: number | null;
  status: string;
  kickoff: string;
  venue: string | null;
  qualified?: string | null; // 'a' | 'b' : équipe qualifiée (prolong./tab compris)
  final_a?: number | null;
  final_b?: number | null;
  pens_a?: number | null;
  pens_b?: number | null;
};

const ROUNDS = [
  { key: "r32", label: "1/16 de finale" },
  { key: "r16", label: "1/8 de finale" },
  { key: "qf", label: "Quarts de finale" },
  { key: "sf", label: "Demi-finales" },
  { key: "final", label: "Finale" },
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

function Flag({ code, size = 21 }: { code: string | null; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 overflow-hidden rounded-full bg-surface-2 ring-2 ring-white/20"
      style={{ width: size, height: size }}
    >
      {code ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`https://flagcdn.com/${code.toLowerCase()}.svg`} alt="" className="h-full w-full object-cover" />
      ) : null}
    </span>
  );
}

function TeamRow({ code, name, score, win, dim }: { code: string | null; name: string; score: number | null; win: boolean; dim: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${dim ? "opacity-45" : ""}`}>
      <Flag code={code} />
      <span className={`min-w-0 flex-1 truncate text-[14px] ${win ? "font-bold text-warning" : "font-medium"}`}>{name}</span>
      <span className={`w-4 shrink-0 text-right text-[14px] font-bold tabular-nums ${win ? "text-warning" : ""}`}>
        {score ?? "–"}
      </span>
    </div>
  );
}

function Card({ m }: { m: BracketMatch }) {
  const done = m.status === "finished" && m.score_a != null && m.score_b != null;
  // Vainqueur = vrai qualifié (prolongation/tab compris) si connu, sinon déduit du score à 90 min.
  const aWin = m.qualified === "a" || (m.qualified == null && done && (m.score_a as number) > (m.score_b as number));
  const bWin = m.qualified === "b" || (m.qualified == null && done && (m.score_b as number) > (m.score_a as number));
  // Score affiché = résultat réel (prolongation/tab incluses).
  const dr = displayResult(m);
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border bg-surface p-2.5 shadow-card ${
        m.stage === "final" ? "border-warning" : "border-border"
      }`}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <TeamRow code={m.team_a_code} name={m.team_a} score={dr.a} win={aWin} dim={bWin} />
        <TeamRow code={m.team_b_code} name={m.team_b} score={dr.b} win={bWin} dim={aWin} />
      </div>
      <div className="shrink-0 text-right text-[11px] leading-tight text-muted">
        <div className="font-semibold tabular-nums text-text">{fmtDate(m.kickoff)}</div>
        <div className="tabular-nums">{fmtTime(m.kickoff)}</div>
        {dr.note && <div className="font-semibold text-warning">{dr.note}</div>}
        {m.venue && <div className="max-w-[88px] truncate">{m.venue}</div>}
      </div>
    </div>
  );
}

const Chev = ({ dir, onClick, hidden }: { dir: "l" | "r"; onClick?: () => void; hidden?: boolean }) => (
  <button
    onClick={onClick}
    className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-surface-2 text-muted active:scale-90 transition ${
      hidden ? "invisible" : ""
    }`}
    aria-label={dir === "l" ? "Tour précédent" : "Tour suivant"}
  >
    {dir === "l" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
  </button>
);

/** Tableau de la phase finale façon Flashscore (cartes larges, chevrons, connexions). */
export function BracketView({ matches }: { matches: BracketMatch[] }) {
  const present = ROUNDS.filter((r) => matches.some((m) => m.stage === r.key));
  const current =
    present.find((r) => matches.some((m) => m.stage === r.key && m.status !== "finished"))?.key ??
    present[present.length - 1]?.key ??
    "r32";
  const [tab, setTab] = useState(current);

  if (!present.length) {
    return (
      <div className="pt-12 text-center text-muted">
        <div className="mb-2 text-3xl">🏆</div>
        Le tableau s&apos;affichera dès le début de la phase finale.
      </div>
    );
  }

  const idx = ROUNDS.findIndex((r) => r.key === tab);
  const hasPrev = ROUNDS.slice(0, idx).some((r) => present.some((p) => p.key === r.key));
  const hasNext = ROUNDS.slice(idx + 1).some((r) => present.some((p) => p.key === r.key));
  const goPrev = () => {
    for (let i = idx - 1; i >= 0; i--) if (present.some((p) => p.key === ROUNDS[i].key)) return setTab(ROUNDS[i].key);
  };
  const goNext = () => {
    for (let i = idx + 1; i < ROUNDS.length; i++) if (present.some((p) => p.key === ROUNDS[i].key)) return setTab(ROUNDS[i].key);
  };

  const finalM = matches.find(
    (m) => m.stage === "final" && m.status === "finished" && m.score_a != null && m.score_b != null
  );
  // Champion = équipe qualifiée de la finale (prolong./tab compris), sinon vainqueur au score.
  const champSide = finalM
    ? finalM.qualified ?? ((finalM.score_a as number) > (finalM.score_b as number) ? "a" : "b")
    : null;
  const champ = finalM
    ? champSide === "a"
      ? { n: finalM.team_a, c: finalM.team_a_code }
      : { n: finalM.team_b, c: finalM.team_b_code }
    : null;

  const list = matches.filter((m) => m.stage === tab).sort((a, b) => (a.match_no ?? 0) - (b.match_no ?? 0));
  const third = tab === "final" ? matches.filter((m) => m.stage === "third") : [];
  const pairs: BracketMatch[][] = [];
  for (let i = 0; i < list.length; i += 2) pairs.push(list.slice(i, i + 2));

  return (
    <div>
      {champ && (
        <div className="mb-4 flex items-center justify-center gap-3 rounded-2xl border border-warning bg-surface p-3.5 shadow-card">
          <span className="text-2xl">🏆</span>
          <Flag code={champ.c} size={26} />
          <span className="text-[15px] font-extrabold">Champion · {champ.n}</span>
        </div>
      )}

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {present.map((r) => (
          <button
            key={r.key}
            onClick={() => setTab(r.key)}
            className={`shrink-0 whitespace-nowrap rounded-xl border px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-wide transition active:scale-95 ${
              tab === r.key ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface text-muted"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {pairs.map((pair, pi) => (
        <div key={pi} className="relative mb-4 pr-12">
          {pair.map((m, i) => (
            <div key={m.match_no ?? i} className="my-1.5 flex items-center gap-2">
              <Chev dir="l" onClick={goPrev} hidden={!hasPrev} />
              <Card m={m} />
            </div>
          ))}
          {hasNext && pair.length === 2 && (
            <>
              <div className="absolute bottom-1/4 right-[30px] top-1/4 w-3 rounded-r-lg border-2 border-l-0 border-white/25" />
              <button
                onClick={goNext}
                aria-label="Tour suivant"
                className="absolute right-0 top-1/2 grid h-[34px] w-[34px] -translate-y-1/2 place-items-center rounded-[10px] bg-surface-2 text-muted active:scale-90 transition"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
      ))}

      {third.length > 0 && (
        <div className="mt-2">
          <p className="mb-1.5 ml-1 text-[11px] font-bold uppercase tracking-wide text-muted">3e place</p>
          {third.map((m, i) => (
            <div key={m.match_no ?? i} className="my-1.5 flex items-center gap-2">
              <Chev dir="l" hidden />
              <Card m={m} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
