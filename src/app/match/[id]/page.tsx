"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Lock, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ScorePicker } from "@/components/ScorePicker";
import { Button } from "@/components/ui/button";
import { formatKickoff } from "@/lib/utils";

type Match = {
  id: string;
  group_label: string | null;
  kickoff: string;
  venue: string | null;
  team_a: string;
  team_a_code: string | null;
  team_b: string;
  team_b_code: string | null;
  score_a: number | null;
  score_b: number | null;
  status: string;
};

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [match, setMatch] = useState<Match | null>(null);
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: m } = await supabase.from("matches").select("*").eq("id", id).single();
      setMatch(m as Match);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase
          .from("predictions")
          .select("pred_a, pred_b")
          .eq("match_id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (p) {
          setA(p.pred_a);
          setB(p.pred_b);
        }
      }
    })();
  }, [id, supabase]);

  if (!match) {
    return <div className="px-6 pt-24 text-center text-muted">Chargement…</div>;
  }

  const locked = new Date(match.kickoff) <= new Date();

  async function save() {
    setSaving(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    const { error: upsertError } = await supabase
      .from("predictions")
      .upsert({ match_id: id, user_id: user.id, pred_a: a, pred_b: b }, { onConflict: "match_id,user_id" });

    setSaving(false);
    if (upsertError) {
      // L'écriture peut être refusée par la base (match déjà commencé, plus membre du pool…).
      setError("Impossible d'enregistrer ton prono. Le match a peut-être déjà commencé — réessaie.");
      return;
    }
    setSaved(true);
    setTimeout(() => router.push("/"), 600);
  }

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+14px)]">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-accent font-medium -ml-1 mb-6">
        <ChevronLeft size={22} /> Retour
      </button>

      <div className="text-center text-[13px] text-muted mb-1">
        {match.group_label ? `Groupe ${match.group_label}` : "Phase finale"}
      </div>
      <div className="text-center text-[13px] text-muted mb-8">
        {formatKickoff(match.kickoff)}
        {match.venue ? ` · ${match.venue}` : ""}
      </div>

      {match.status === "finished" && (
        <div className="text-center mb-6">
          <span className="text-xs uppercase tracking-wide text-muted">Résultat final</span>
          <div className="text-4xl font-bold tabular-nums">
            {match.score_a} – {match.score_b}
          </div>
        </div>
      )}

      <ScorePicker
        teamA={match.team_a}
        codeA={match.team_a_code}
        teamB={match.team_b}
        codeB={match.team_b_code}
        a={a}
        b={b}
        onA={setA}
        onB={setB}
        disabled={locked}
      />

      <div className="mt-10">
        {locked ? (
          <div className="flex items-center justify-center gap-2 text-muted text-sm">
            <Lock size={16} /> Pronostics fermés (match commencé)
          </div>
        ) : (
          <Button size="lg" onClick={save} disabled={saving}>
            {saved ? (
              <>
                <Check size={20} /> Enregistré !
              </>
            ) : saving ? (
              "Enregistrement…"
            ) : (
              "Valider mon prono"
            )}
          </Button>
        )}
        {error && (
          <p className="mt-3 text-center text-sm text-[#ff3b30]">{error}</p>
        )}
      </div>
    </div>
  );
}
