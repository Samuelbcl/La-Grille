import { Flag } from "@/components/Flag";

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
};

const ROUNDS: { key: string; label: string }[] = [
  { key: "r32", label: "16es de finale" },
  { key: "r16", label: "8es de finale" },
  { key: "qf", label: "Quarts de finale" },
  { key: "sf", label: "Demi-finales" },
  { key: "final", label: "Finale" },
];

function TeamLine({
  name,
  code,
  score,
  win,
  dim,
}: {
  name: string;
  code: string | null;
  score: number | null;
  win: boolean;
  dim: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-2 ${dim ? "opacity-45" : ""}`}>
      <span className="flex min-w-0 items-center gap-2">
        <Flag code={code} size={18} />
        <span className={`truncate text-[14px] ${win ? "font-bold text-accent" : "font-medium"}`}>{name}</span>
      </span>
      <span className="w-6 shrink-0 text-right text-[15px] font-bold tabular-nums">{score ?? "–"}</span>
    </div>
  );
}

function MatchBox({ m }: { m: BracketMatch }) {
  const done = m.status === "finished" && m.score_a != null && m.score_b != null;
  const aWin = done && (m.score_a as number) > (m.score_b as number);
  const bWin = done && (m.score_b as number) > (m.score_a as number);
  return (
    <div
      className={`rounded-2xl border bg-surface p-3 shadow-card ${
        m.stage === "final" ? "border-accent" : "border-border"
      }`}
    >
      <TeamLine name={m.team_a} code={m.team_a_code} score={m.score_a} win={aWin} dim={bWin} />
      <div className="my-1.5 h-px bg-border" />
      <TeamLine name={m.team_b} code={m.team_b_code} score={m.score_b} win={bWin} dim={aWin} />
    </div>
  );
}

/** Tableau de la phase finale (16es → finale), qui se remplit avec les résultats. */
export function BracketView({ matches }: { matches: BracketMatch[] }) {
  if (!matches.length) {
    return (
      <div className="pt-12 text-center text-muted">
        <div className="mb-2 text-3xl">🏆</div>
        Le tableau s&apos;affichera dès le début de la phase finale.
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {ROUNDS.map((r) => {
        const ms = matches
          .filter((m) => m.stage === r.key)
          .sort((a, b) => (a.match_no ?? 0) - (b.match_no ?? 0));
        if (!ms.length) return null;
        return (
          <section key={r.key}>
            <h3 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-accent">{r.label}</h3>
            <div className="space-y-2">
              {ms.map((m, i) => (
                <MatchBox key={`${r.key}-${i}`} m={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
