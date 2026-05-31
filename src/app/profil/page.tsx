import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPool, getLeaderboard } from "@/lib/queries";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

function avatarColor(s: string): string {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 60% 45%)`;
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-surface border border-border shadow-card px-4 py-3.5">
      <div className={`text-2xl font-bold tabular-nums ${accent ? "text-accent" : ""}`}>{value}</div>
      <div className="text-[12px] text-muted mt-0.5">{label}</div>
    </div>
  );
}

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pool = await getCurrentPool();

  // Nom affiché
  let name = user?.email?.split("@")[0] ?? "Joueur";
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    if (prof?.display_name) name = prof.display_name;
  }

  // Stats depuis le classement
  let stats = { points: 0, rank: 0, exact: 0, correct: 0, played: 0 };
  if (pool && user) {
    const rows = (await getLeaderboard(pool.id)) as Array<{
      user_id: string;
      total_points: number;
      exact_count: number;
      correct_count: number;
      played_count: number;
    }>;
    const idx = rows.findIndex((r) => r.user_id === user.id);
    if (idx >= 0) {
      const r = rows[idx];
      stats = {
        points: r.total_points,
        rank: idx + 1,
        exact: r.exact_count,
        correct: r.correct_count,
        played: r.played_count,
      };
    }
  }

  return (
    <>
      <header className="glass sticky top-0 z-30 px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3 border-b border-border">
        <h1 className="text-[22px] font-bold tracking-tight">Profil</h1>
      </header>

      <div className="px-4 py-4 space-y-5">
        {/* Identité */}
        <div className="flex items-center gap-3.5">
          <span
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-2xl font-bold text-white"
            style={{ backgroundColor: avatarColor(name) }}
          >
            {name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-xl font-bold truncate">{name}</p>
            <p className="text-sm text-muted truncate">
              {pool ? pool.name : user?.email ?? ""}
            </p>
          </div>
        </div>

        {/* Stats */}
        {pool ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Points" value={stats.points} accent />
              <Stat label="Classement" value={stats.rank ? `#${stats.rank}` : "—"} />
              <Stat label="Scores exacts" value={stats.exact} />
              <Stat label="Bons vainqueurs" value={stats.correct} />
            </div>
            <p className="text-center text-xs text-muted">
              {stats.played} match{stats.played > 1 ? "s" : ""} terminé{stats.played > 1 ? "s" : ""}
            </p>
          </>
        ) : (
          <p className="text-center text-muted pt-6">
            Rejoins un pool depuis l'onglet <b>Gérer</b> pour voir tes stats.
          </p>
        )}

        {/* Liens */}
        <div className="rounded-2xl bg-surface border border-border shadow-card divide-y divide-border">
          <Link href="/regles" className="flex items-center justify-between px-4 py-3.5 active:bg-surface-2 transition">
            <span className="font-medium">Règles & barème</span>
            <ChevronRight size={18} className="text-muted" />
          </Link>
          <Link href="/admin" className="flex items-center justify-between px-4 py-3.5 active:bg-surface-2 transition">
            <span className="font-medium">Gérer mon pool</span>
            <ChevronRight size={18} className="text-muted" />
          </Link>
        </div>

        <SignOutButton />
      </div>
    </>
  );
}
