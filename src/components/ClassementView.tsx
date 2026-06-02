"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Flag } from "@/components/Flag";
import { Avatar } from "@/components/Avatar";
import type { TeamStanding } from "@/lib/standings";

export type LbRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  fav_team: string | null;
  total_points: number;
  exact_count: number;
  correct_count: number;
  played_count: number;
};

const MEDALS = ["🥇", "🥈", "🥉"];

function PodiumSpot({ row, place, me }: { row: LbRow; place: 1 | 2 | 3; me: boolean }) {
  const ped = place === 1 ? "h-20" : place === 2 ? "h-14" : "h-10";
  return (
    <div className="flex w-1/3 flex-col items-center">
      <div className="text-2xl">{MEDALS[place - 1]}</div>
      <Avatar
        url={row.avatar_url}
        name={row.display_name}
        team={row.fav_team}
        size={place === 1 ? 64 : 56}
        className={`mt-1 ${me ? "ring-2 ring-accent" : ""}`}
      />
      <p className="mt-1.5 max-w-full truncate px-1 text-[13px] font-semibold">{row.display_name}</p>
      <p className="text-[12px] font-bold tabular-nums text-accent">{row.total_points} pts</p>
      <div className={`mt-2 grid w-full ${ped} place-items-end justify-center rounded-t-xl border border-b-0 border-border bg-surface-2`}>
        <span className="pb-1 text-lg font-bold text-muted">{place}</span>
      </div>
    </div>
  );
}

function RankRow({ row, rank, me }: { row: LbRow; rank: number; me: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-card ${me ? "border-accent" : "border-border bg-surface"}`}>
      <span className="w-5 text-center text-sm font-bold tabular-nums text-muted">{rank}</span>
      <Avatar url={row.avatar_url} name={row.display_name} team={row.fav_team} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          {row.display_name}
          {me && <span className="text-accent"> · toi</span>}
        </p>
        <p className="text-[12px] text-muted">
          {row.exact_count} exact{row.exact_count > 1 ? "s" : ""} · {row.correct_count} bon
          {row.correct_count > 1 ? "s" : ""}
        </p>
      </div>
      <span className="text-lg font-bold tabular-nums">{row.total_points}</span>
      <span className="-ml-1 text-[11px] text-muted">pts</span>
    </div>
  );
}

function Players({ rows, me }: { rows: LbRow[]; me: string }) {
  if (rows.length === 0) {
    return (
      <div className="pt-12 text-center text-muted">
        <Trophy className="mx-auto mb-3" size={32} />
        Le classement s&apos;affichera dès les premiers résultats.
      </div>
    );
  }
  const top = rows.slice(0, 3);
  const rest = rows.slice(3);
  return (
    <>
      <div className="mb-5 flex items-end justify-center gap-2 pt-1">
        {top[1] && <PodiumSpot row={top[1]} place={2} me={top[1].user_id === me} />}
        {top[0] && <PodiumSpot row={top[0]} place={1} me={top[0].user_id === me} />}
        {top[2] && <PodiumSpot row={top[2]} place={3} me={top[2].user_id === me} />}
      </div>
      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((r, i) => (
            <RankRow key={r.user_id} row={r} rank={i + 4} me={r.user_id === me} />
          ))}
        </div>
      )}
    </>
  );
}

function GroupTable({ label, rows }: { label: string; rows: TeamStanding[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      <div className="bg-surface-2 px-4 py-2 text-[13px] font-semibold">Groupe {label}</div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-[11px] text-muted">
            <th className="w-7 py-1.5 pl-3 text-center font-medium">#</th>
            <th className="py-1.5 text-left font-medium">Équipe</th>
            <th className="w-7 py-1.5 text-center font-medium">J</th>
            <th className="w-10 py-1.5 text-center font-medium">Diff</th>
            <th className="w-9 py-1.5 pr-3 text-center font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => (
            <tr key={t.team} className="border-t border-border">
              <td className={`py-2 text-center tabular-nums ${i < 2 ? "font-bold text-accent" : "text-muted"}`}>{i + 1}</td>
              <td className="py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <Flag code={t.code} size={15} />
                  <span className="truncate">{t.team}</span>
                </span>
              </td>
              <td className="py-2 text-center tabular-nums text-muted">{t.played}</td>
              <td className="py-2 text-center tabular-nums">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
              <td className="py-2 pr-3 text-center font-bold tabular-nums">{t.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ClassementView({
  players,
  standings,
  me,
  poolId,
}: {
  players: LbRow[];
  standings: Record<string, TeamStanding[]>;
  me: string;
  poolId: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"players" | "groups">("players");
  const groupLabels = Object.keys(standings).sort();

  // Temps réel : rafraîchit le classement dès qu'un score de match change.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`leaderboard-${poolId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `pool_id=eq.${poolId}` },
        () => router.refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [poolId, router]);

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex rounded-2xl bg-surface-2 p-1 text-sm font-medium">
        <button
          onClick={() => setTab("players")}
          className={cn("flex-1 rounded-xl py-2", tab === "players" ? "bg-surface shadow-card" : "text-muted")}
        >
          Joueurs
        </button>
        <button
          onClick={() => setTab("groups")}
          className={cn("flex-1 rounded-xl py-2", tab === "groups" ? "bg-surface shadow-card" : "text-muted")}
        >
          Poules
        </button>
      </div>

      {tab === "players" ? (
        <Players rows={players} me={me} />
      ) : groupLabels.length === 0 ? (
        <p className="pt-12 text-center text-muted">Importe les matchs pour voir les poules.</p>
      ) : (
        <div className="space-y-3">
          {groupLabels.map((g) => (
            <GroupTable key={g} label={g} rows={standings[g]} />
          ))}
          <p className="pt-1 text-center text-[11px] text-muted">
            Les 2 premiers de chaque groupe sont qualifiés (en bleu).
          </p>
        </div>
      )}
    </div>
  );
}
