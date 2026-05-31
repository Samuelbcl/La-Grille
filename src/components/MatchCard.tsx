"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { flag, formatKickoff, matchState } from "@/lib/utils";
import { outcomeOf, stageBareme } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

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

export function MatchCard({ m, userId }: { m: MatchCardData; userId: string | null }) {
  const router = useRouter();
  const locked = new Date(m.kickoff) <= new Date();
  const finished = m.status === "finished";
  const state = matchState(m.kickoff, m.status);

  // Prono enregistré (état local → retour instantané après "Valider").
  const [predA, setPredA] = useState<number | null>(m.pred_a ?? null);
  const [predB, setPredB] = useState<number | null>(m.pred_b ?? null);
  const hasPred = predA != null && predB != null;

  // Édition inline.
  const [editing, setEditing] = useState(false);
  const [a, setA] = useState(predA ?? 0);
  const [b, setB] = useState(predB ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🎉 Confettis (une seule fois par match) quand TON prono est un score exact.
  useEffect(() => {
    if (state !== "finished" || predA == null || predB == null) return;
    if (!(predA === m.score_a && predB === m.score_b)) return;
    try {
      const key = "lagrille:celebrated";
      const seen: string[] = JSON.parse(localStorage.getItem(key) || "[]");
      if (seen.includes(m.id)) return;
      localStorage.setItem(key, JSON.stringify([...seen, m.id]));
    } catch {}
    import("canvas-confetti")
      .then(({ default: confetti }) =>
        confetti({ particleCount: 110, spread: 75, origin: { y: 0.7 }, colors: ["#0A84FF", "#ffd166", "#ffffff"] })
      )
      .catch(() => {});
  }, [state, predA, predB, m.id, m.score_a, m.score_b]);

  function openEdit() {
    setA(predA ?? 0);
    setB(predB ?? 0);
    setError(null);
    setEditing(true);
  }

  async function save() {
    if (!userId) return router.push("/login");
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: upsertError } = await supabase
      .from("predictions")
      .upsert(
        { match_id: m.id, user_id: userId, pred_a: a, pred_b: b },
        { onConflict: "match_id,user_id" }
      );
    setSaving(false);
    if (upsertError) {
      setError("Échec — le match a peut-être déjà commencé.");
      return;
    }
    setPredA(a);
    setPredB(b);
    setEditing(false);
    import("canvas-confetti")
      .then(({ default: confetti }) =>
        confetti({ particleCount: 45, spread: 55, scalar: 0.8, origin: { y: 0.8 }, colors: ["#0A84FF", "#ffd166", "#ffffff"] })
      )
      .catch(() => {});
    router.refresh(); // met à jour le compteur "à pronostiquer" et le classement
  }

  const outcome =
    finished && hasPred ? outcomeOf(predA!, predB!, m.score_a, m.score_b) : "pending";
  const bareme = stageBareme(m.stage);
  const badge =
    outcome === "exact"
      ? { text: `Score exact +${bareme.exact}`, cls: "text-success" }
      : outcome === "correct"
        ? { text: `Bon vainqueur +${bareme.outcome}`, cls: "text-accent" }
        : outcome === "partial"
          ? { text: "Un score bon +1", cls: "text-accent" }
          : outcome === "wrong"
            ? { text: "Raté", cls: "text-muted" }
            : null;

  return (
    <div className="rounded-2xl bg-surface border border-border shadow-card p-4">
      {/* En-tête : groupe · date  +  bouton d'action en haut à droite */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted mb-3">
        <span className="min-w-0 truncate">
          {m.group_label ? `Groupe ${m.group_label} · ` : ""}
          {formatKickoff(m.kickoff)}
        </span>
        {state === "upcoming" && (
          <button
            onClick={() => (editing ? setEditing(false) : openEdit())}
            className="shrink-0 font-medium text-accent"
          >
            {editing ? "Annuler" : hasPred ? "Modifier" : "Pronostiquer"}
          </button>
        )}
        {state === "live" && (
          <span className="shrink-0 inline-flex items-center gap-1 font-semibold text-[#ff3b30]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff3b30] animate-pulse" /> En direct
          </span>
        )}
        {state === "finished" && <span className="shrink-0 font-medium text-muted">Terminé</span>}
      </div>

      {editing ? (
        <div className="space-y-3">
          <EditRow name={m.team_a} code={m.team_a_code} value={a} onChange={setA} />
          <EditRow name={m.team_b} code={m.team_b_code} value={b} onChange={setB} />
          <Button size="md" className="w-full" onClick={save} disabled={saving}>
            {saving ? "Enregistrement…" : "Valider mon prono"}
          </Button>
          {error && <p className="text-center text-sm text-[#ff3b30]">{error}</p>}
        </div>
      ) : (
        <>
          <Row name={m.team_a} code={m.team_a_code} score={finished ? m.score_a : null} pred={predA} />
          <div className="h-px bg-border my-2" />
          <Row name={m.team_b} code={m.team_b_code} score={finished ? m.score_b : null} pred={predB} />

          {badge && <div className={`mt-3 text-[11px] font-semibold ${badge.cls}`}>{badge.text}</div>}
          {!finished && hasPred && (
            <div className="mt-3 text-[11px] text-muted">
              Ton prono : <span className="text-text font-semibold">{predA} – {predB}</span>
            </div>
          )}
          {!finished && !hasPred && locked && (
            <div className="mt-3 text-[11px] text-muted">Pas de prono (match commencé)</div>
          )}
        </>
      )}
    </div>
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

function EditRow({
  name,
  code,
  value,
  onChange,
}: {
  name: string;
  code: string | null;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-2xl leading-none">{flag(code)}</span>
      <span className="flex-1 min-w-0 truncate font-semibold text-[15px]">{name}</span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          aria-label={`Moins — ${name}`}
          disabled={value <= 0}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="grid place-items-center h-9 w-9 rounded-full bg-surface-2 border border-border active:scale-90 transition disabled:opacity-30"
        >
          <Minus size={16} />
        </button>
        <span className="tabular-nums text-xl font-bold w-6 text-center">{value}</span>
        <button
          type="button"
          aria-label={`Plus — ${name}`}
          disabled={value >= 20}
          onClick={() => onChange(value + 1)}
          className="grid place-items-center h-9 w-9 rounded-full bg-surface-2 border border-border active:scale-90 transition disabled:opacity-30"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
