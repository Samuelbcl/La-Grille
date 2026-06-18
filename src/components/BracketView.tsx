"use client";

import { useState } from "react";
import { formatKickoff } from "@/lib/utils";

export type BracketMatch = {
  stage: string; // r32 | r16 | qf | sf | final
  match_no: number | null;
  team_a: string;
  team_a_code: string | null;
  team_b: string;
  team_b_code: string | null;
  score_a: number | null;
  score_b: number | null;
  status: string;
  kickoff: string;
};

const ROUNDS = [
  { key: "r32", label: "16es" },
  { key: "r16", label: "8es" },
  { key: "qf", label: "Quarts" },
  { key: "sf", label: "Demies" },
  { key: "final", label: "Finale" },
];

function RoundFlag({ code, size = 24 }: { code: string | null; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 overflow-hidden rounded-full bg-surface-2 ring-1 ring-white/20"
      style={{ width: size, height: size }}
    >
      {code ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`https://flagcdn.com/${code.toLowerCase()}.svg`} alt="" className="h-full w-full object-cover" />
      ) : null}
    </span>
  );
}

function Team({
  code,
  name,
  score,
  win,
  dim,
}: {
  code: string | null;
  name: string;
  score: number | null;
  win: boolean;
  dim: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${dim ? "opacity-45" : ""}`}>
      <RoundFlag code={code} />
      <span className={`min-w-0 flex-1 truncate text-[14px] ${win ? "font-bold text-warning" : "font-medium"}`}>{name}</span>
      <span className={`w-6 shrink-0 text-right text-[15px] font-bold tabular-nums ${win ? "text-warning" : ""}`}>
        {score ?? "–"}
      </span>
    </div>
  );
}

function Match({ m }: { m: BracketMatch }) {
  const done = m.status === "finished" && m.score_a != null && m.score_b != null;
  const aWin = done && (m.score_a as number) > (m.score_b as number);
  const bWin = done && (m.score_b as number) > (m.score_a as number);
  return (
    <div className={`rounded-2xl border bg-surface p-3 shadow-card ${m.stage === "final" ? "border-warning" : "border-border"}`}>
      <p className="mb-1.5 text-center text-[11px] text-muted">{formatKickoff(m.kickoff)}</p>
      <Team code={m.team_a_code} name={m.team_a} score={m.score_a} win={aWin} dim={bWin} />
      <div className="my-1.5 h-px bg-border" />
      <Team code={m.team_b_code} name={m.team_b} score={m.score_b} win={bWin} dim={aWin} />
    </div>
  );
}

/** Tableau de la phase finale, avec sélecteur de tour (mobile-friendly). */
export function BracketView({ matches }: { matches: BracketMatch[] }) {
  const present = ROUNDS.filter((r) => matches.some((m) => m.stage === r.key));
  // Tour « courant » : le premier avec un match pas encore terminé, sinon le dernier.
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

  const final = matches.find(
    (m) => m.stage === "final" && m.status === "finished" && m.score_a != null && m.score_b != null
  );
  const champ = final
    ? (final.score_a as number) > (final.score_b as number)
      ? { n: final.team_a, c: final.team_a_code }
      : { n: final.team_b, c: final.team_b_code }
    : null;

  const list = matches.filter((m) => m.stage === tab).sort((a, b) => (a.match_no ?? 0) - (b.match_no ?? 0));

  return (
    <div>
      {champ && (
        <div className="mb-4 flex items-center justify-center gap-3 rounded-2xl border border-warning bg-surface p-3.5 shadow-card">
          <span className="text-2xl">🏆</span>
          <RoundFlag code={champ.c} size={28} />
          <span className="text-[15px] font-extrabold">Champion · {champ.n}</span>
        </div>
      )}

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {present.map((r) => (
          <button
            key={r.key}
            onClick={() => setTab(r.key)}
            className={`shrink-0 rounded-xl border px-3.5 py-1.5 text-[13px] font-semibold transition active:scale-95 ${
              tab === r.key ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface text-muted"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {list.map((m, i) => (
          <Match key={m.match_no ?? i} m={m} />
        ))}
      </div>
    </div>
  );
}
