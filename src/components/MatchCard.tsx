import Link from "next/link";
import { flag, formatKickoff } from "@/lib/utils";
import { outcomeOf, stageBareme } from "@/lib/scoring";

export interface MatchCardData {
  id: string;
  group_label: string | null;
  stage?: string;
  kickoff: string;
  team_a: string;
  team_a_code: string | null;
  team_b: string;
  team_b_code: string | null;
  score_a: number | null;
  score_b: number | null;
  status: string;
  pred_a?: number | null;
  pred_b?: number | null;
}

export function MatchCard({ m }: { m: MatchCardData }) {
  const locked = new Date(m.kickoff) <= new Date();
  const hasPred = m.pred_a != null && m.pred_b != null;
  const finished = m.status === "finished";

  const outcome =
    finished && hasPred
      ? outcomeOf(m.pred_a!, m.pred_b!, m.score_a, m.score_b)
      : "pending";

  const b = stageBareme(m.stage);
  const badge =
    outcome === "exact"
      ? { text: `Score exact +${b.exact}`, cls: "text-success" }
      : outcome === "correct"
        ? { text: `Bon vainqueur +${b.outcome}`, cls: "text-accent" }
        : outcome === "partial"
          ? { text: "Un score bon +1", cls: "text-accent" }
          : outcome === "wrong"
            ? { text: "Raté", cls: "text-muted" }
            : null;

  return (
    <Link
      href={`/match/${m.id}`}
      className="block rounded-2xl bg-surface border border-border shadow-card p-4 active:scale-[0.99] transition"
    >
      <div className="flex items-center justify-between text-[11px] text-muted mb-3">
        <span>
          {m.group_label ? `Groupe ${m.group_label} · ` : ""}
          {formatKickoff(m.kickoff)}
        </span>
        {!locked && (
          <span className="text-accent font-medium">
            {hasPred ? "Modifier" : "Pronostiquer"}
          </span>
        )}
      </div>

      <Row name={m.team_a} code={m.team_a_code} score={finished ? m.score_a : null} pred={m.pred_a} />
      <div className="h-px bg-border my-2" />
      <Row name={m.team_b} code={m.team_b_code} score={finished ? m.score_b : null} pred={m.pred_b} />

      {badge && (
        <div className={`mt-3 text-[11px] font-semibold ${badge.cls}`}>{badge.text}</div>
      )}
      {!finished && hasPred && (
        <div className="mt-3 text-[11px] text-muted">
          Ton prono : <span className="text-text font-semibold">{m.pred_a} – {m.pred_b}</span>
        </div>
      )}
    </Link>
  );
}

function Row({
  name,
  code,
  score,
  pred,
}: {
  name: string;
  code: string | null;
  score: number | null;
  pred?: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-2xl leading-none">{flag(code)}</span>
        <span className="font-semibold text-[15px] truncate">{name}</span>
      </div>
      <span className="tabular-nums text-lg font-bold w-7 text-right shrink-0">
        {score != null ? score : pred != null ? <span className="text-muted text-sm">{pred}</span> : "–"}
      </span>
    </div>
  );
}
