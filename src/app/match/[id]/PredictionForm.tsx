"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ScorePicker } from "@/components/ScorePicker";
import { Button } from "@/components/ui/button";

/**
 * Partie interactive de la page d'un match. Les données (match + prono existant)
 * sont chargées côté serveur et passées en props → aucun chargement à l'ouverture.
 */
export function PredictionForm({
  matchId,
  userId,
  kickoff,
  teamA,
  codeA,
  teamB,
  codeB,
  initialA,
  initialB,
}: {
  matchId: string;
  userId: string | null;
  kickoff: string;
  teamA: string;
  codeA: string | null;
  teamB: string;
  codeB: string | null;
  initialA: number;
  initialB: number;
}) {
  const router = useRouter();
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = new Date(kickoff) <= new Date();

  async function save() {
    if (!userId) return router.push("/login");
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: upsertError } = await supabase
      .from("predictions")
      .upsert(
        { match_id: matchId, user_id: userId, pred_a: a, pred_b: b },
        { onConflict: "match_id,user_id" }
      );
    setSaving(false);
    if (upsertError) {
      setError("Impossible d'enregistrer ton prono. Le match a peut-être déjà commencé — réessaie.");
      return;
    }
    setSaved(true);
    setTimeout(() => router.push("/"), 600);
  }

  return (
    <>
      <ScorePicker
        teamA={teamA}
        codeA={codeA}
        teamB={teamB}
        codeB={codeB}
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
        {error && <p className="mt-3 text-center text-sm text-[#ff3b30]">{error}</p>}
      </div>
    </>
  );
}
