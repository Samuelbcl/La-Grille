import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPool, getTeams, getUserBonus, getBonusResults } from "@/lib/queries";
import { BonusForm } from "@/components/BonusForm";
import { BONUS_TOTAL } from "@/lib/bonus";

export const dynamic = "force-dynamic";

export default async function BonusPage() {
  const pool = await getCurrentPool();
  if (!pool) {
    return <div className="px-6 pt-24 text-center text-muted">Rejoins un groupe d&apos;abord.</div>;
  }

  const supabase = await createClient();
  const [teams, userBonus, results, { data: ko }] = await Promise.all([
    getTeams(pool.id),
    getUserBonus(pool.id, pool.user_id),
    getBonusResults(pool.id),
    supabase
      .from("matches")
      .select("id")
      .eq("pool_id", pool.id)
      .neq("stage", "group")
      .lte("kickoff", new Date().toISOString())
      .limit(1),
  ]);
  // Clôturé dès qu'un match de phase finale a commencé.
  const locked = (ko ?? []).length > 0;

  return (
    <>
      <header className="app-header sticky top-0 z-30 px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3">
        <Link href="/pronos" className="flex items-center gap-1 text-sm font-medium text-accent">
          <ChevronLeft size={16} /> Pronos
        </Link>
        <h1 className="mt-1 text-[22px] font-bold tracking-tight">Pronos bonus 🎯</h1>
        <p className="text-[13px] text-muted">{BONUS_TOTAL} points en jeu pour la phase finale.</p>
      </header>

      <div className="px-4 py-4">
        <BonusForm
          poolId={pool.id}
          userId={pool.user_id}
          teams={teams}
          initial={userBonus.answers}
          validated={userBonus.validated}
          locked={locked}
          results={results}
        />
      </div>
    </>
  );
}
