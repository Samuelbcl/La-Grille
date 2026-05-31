import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatKickoff } from "@/lib/utils";
import { PredictionForm } from "./PredictionForm";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Match + utilisateur en parallèle (côté serveur, proche de la base = rapide).
  const [matchRes, userRes] = await Promise.all([
    supabase.from("matches").select("*").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);

  const match = matchRes.data;
  if (!match) notFound();

  // Prono existant de l'utilisateur (pour pré-remplir le sélecteur).
  const user = userRes.data.user;
  let initialA = 0;
  let initialB = 0;
  if (user) {
    const { data: pred } = await supabase
      .from("predictions")
      .select("pred_a, pred_b")
      .eq("match_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (pred) {
      initialA = pred.pred_a;
      initialB = pred.pred_b;
    }
  }

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+14px)]">
      <Link href="/" className="flex items-center gap-1 text-accent font-medium -ml-1 mb-6">
        <ChevronLeft size={22} /> Retour
      </Link>

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

      <PredictionForm
        matchId={match.id}
        userId={user?.id ?? null}
        kickoff={match.kickoff}
        teamA={match.team_a}
        codeA={match.team_a_code}
        teamB={match.team_b}
        codeB={match.team_b_code}
        initialA={initialA}
        initialB={initialB}
      />
    </div>
  );
}
