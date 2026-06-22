"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Crown, Target, Flame, Snowflake, ChevronUp, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Flag } from "@/components/Flag";
import { Avatar } from "@/components/Avatar";
import { BracketView, type BracketMatch } from "@/components/BracketView";
import { PlayerDetail } from "@/components/PlayerDetail";
import type { TeamStanding } from "@/lib/standings";

export type LbRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  exact_count: number;
  correct_count: number;
  played_count: number;
  bonus_points?: number;
};

const MEDALS = ["🥇", "🥈", "🥉"];

const BADGE_META: Record<string, { Icon: LucideIcon; cls: string; label: string }> = {
  leader: { Icon: Crown, cls: "text-warning", label: "Leader" },
  exact: { Icon: Target, cls: "text-accent", label: "Roi du score exact" },
  day: { Icon: Flame, cls: "text-[#ff8a3d]", label: "Meilleur du jour" },
  last: { Icon: Snowflake, cls: "text-muted", label: "Lanterne rouge" },
};

function Badges({ keys }: { keys?: string[] }) {
  if (!keys?.length) return null;
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      {keys.map((k) => {
        const b = BADGE_META[k];
        if (!b) return null;
        const Icon = b.Icon;
        return <Icon key={k} size={14} className={b.cls} aria-label={b.label} />;
      })}
    </span>
  );
}

function Movement({ d }: { d: number }) {
  if (!d) return null;
  const up = d > 0;
  const Icon = up ? ChevronUp : ChevronDown;
  return (
    <span className={`inline-flex items-center text-[11px] font-bold tabular-nums ${up ? "text-success" : "text-[#ff3b30]"}`}>
      <Icon size={13} />
      {Math.abs(d)}
    </span>
  );
}

type RowExtras = { delta: number; badges?: string[] };

function PodiumSpot({ row, place, me, onOpen, delta, badges }: { row: LbRow; place: 1 | 2 | 3; me: boolean; onOpen: () => void } & RowExtras) {
  const ped = place === 1 ? "h-20" : place === 2 ? "h-14" : "h-10";
  return (
    <div className="flex w-1/3 flex-col items-center">
      <button onClick={onOpen} className="flex w-full flex-col items-center active:scale-95 transition">
        <div className="text-2xl">{MEDALS[place - 1]}</div>
        <Avatar
          url={row.avatar_url}
          name={row.display_name}
          size={place === 1 ? 64 : 56}
          className={`mt-1 ${me ? "ring-2 ring-accent" : ""}`}
        />
        <p className="mt-1.5 flex max-w-full items-center gap-1 truncate px-1 text-[13px] font-semibold">
          <span className="truncate">{row.display_name}</span>
          <Badges keys={badges} />
        </p>
        <p className="flex items-center gap-1 text-[12px] font-bold tabular-nums text-accent">
          {row.total_points} pts <Movement d={delta} />
        </p>
        <p className="mt-0.5 text-center text-[10px] leading-tight text-muted tabular-nums">
          {row.exact_count} exact{row.exact_count > 1 ? "s" : ""} · {row.correct_count} bon
          {row.correct_count > 1 ? "s" : ""}
          {row.bonus_points ? <span className="text-warning"> · 🎯+{row.bonus_points}</span> : null}
        </p>
      </button>
      <div className={`mt-2 grid w-full ${ped} place-items-end justify-center rounded-t-xl border border-b-0 border-border bg-surface-2`}>
        <span className="pb-1 text-lg font-bold text-muted">{place}</span>
      </div>
    </div>
  );
}

function RankRow({ row, rank, me, onOpen, delta, badges }: { row: LbRow; rank: number; me: boolean; onOpen: () => void } & RowExtras) {
  return (
    <button
      onClick={onOpen}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-card transition active:scale-[0.99] ${me ? "border-accent" : "border-border bg-surface"}`}
    >
      <span className="w-5 text-center text-sm font-bold tabular-nums text-muted">{rank}</span>
      <Avatar url={row.avatar_url} name={row.display_name} size={36} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 font-semibold">
          <span className="min-w-0 truncate">
            {row.display_name}
            {me && <span className="text-accent"> · toi</span>}
          </span>
          <Badges keys={badges} />
        </p>
        <p className="text-[12px] text-muted">
          {row.exact_count} exact{row.exact_count > 1 ? "s" : ""} · {row.correct_count} bon
          {row.correct_count > 1 ? "s" : ""}
          {row.bonus_points ? <span className="text-warning"> · 🎯+{row.bonus_points}</span> : null}
        </p>
      </div>
      <div className="flex flex-col items-end leading-none">
        <span className="text-lg font-bold tabular-nums">
          {row.total_points}
          <span className="ml-0.5 text-[11px] font-normal text-muted">pts</span>
        </span>
        <Movement d={delta} />
      </div>
    </button>
  );
}

function Players({
  rows,
  me,
  onOpen,
  deltas,
  badges,
}: {
  rows: LbRow[];
  me: string;
  onOpen: (r: LbRow) => void;
  deltas: Record<string, number>;
  badges: Record<string, string[]>;
}) {
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
        {top[1] && <PodiumSpot row={top[1]} place={2} me={top[1].user_id === me} onOpen={() => onOpen(top[1])} delta={deltas[top[1].user_id] ?? 0} badges={badges[top[1].user_id]} />}
        {top[0] && <PodiumSpot row={top[0]} place={1} me={top[0].user_id === me} onOpen={() => onOpen(top[0])} delta={deltas[top[0].user_id] ?? 0} badges={badges[top[0].user_id]} />}
        {top[2] && <PodiumSpot row={top[2]} place={3} me={top[2].user_id === me} onOpen={() => onOpen(top[2])} delta={deltas[top[2].user_id] ?? 0} badges={badges[top[2].user_id]} />}
      </div>
      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((r, i) => (
            <RankRow
              key={r.user_id}
              row={r}
              rank={i + 4}
              me={r.user_id === me}
              onOpen={() => onOpen(r)}
              delta={deltas[r.user_id] ?? 0}
              badges={badges[r.user_id]}
            />
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

type RecapData = {
  count: number;
  top: { user_id: string; display_name: string; avatar_url: string | null; pts: number }[];
};

export function ClassementView({
  players,
  standings,
  me,
  poolId,
  bracket,
  deltas,
  badges,
  recap,
}: {
  players: LbRow[];
  standings: Record<string, TeamStanding[]>;
  me: string;
  poolId: string;
  bracket: BracketMatch[];
  deltas: Record<string, number>;
  badges: Record<string, string[]>;
  recap: RecapData;
}) {
  const router = useRouter();
  const koExists = bracket.length > 0;
  const [tab, setTab] = useState<"players" | "groups">("players");
  const [detail, setDetail] = useState<LbRow | null>(null);
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bonus_results", filter: `pool_id=eq.${poolId}` },
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
          className={cn(
            "flex-1 rounded-xl py-2 transition",
            tab === "players" ? "bg-accent text-accent-fg shadow-card" : "text-muted"
          )}
        >
          Joueurs
        </button>
        <button
          onClick={() => setTab("groups")}
          className={cn(
            "flex-1 rounded-xl py-2 transition",
            tab === "groups" ? "bg-accent text-accent-fg shadow-card" : "text-muted"
          )}
        >
          {koExists ? "Tableau" : "Poules"}
        </button>
      </div>

      {tab === "players" ? (
        <>
          {recap.count > 0 && recap.top.length > 0 && (
            <div className="mb-4 rounded-2xl border border-border bg-surface p-4 shadow-card">
              <div className="mb-2.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-warning">
                <Flame size={14} /> Récap du jour · {recap.count} match{recap.count > 1 ? "s" : ""}
              </div>
              <div className="space-y-1.5">
                {recap.top.map((t, i) => (
                  <div key={t.user_id} className="flex items-center gap-2 text-[13px]">
                    <span className="w-4 text-center text-muted">{i + 1}</span>
                    <Avatar url={t.avatar_url} name={t.display_name} size={22} />
                    <span className="min-w-0 flex-1 truncate font-medium">{t.display_name}</span>
                    <span className="font-bold tabular-nums text-success">+{t.pts}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Players rows={players} me={me} onOpen={setDetail} deltas={deltas} badges={badges} />
        </>
      ) : koExists ? (
        <BracketView matches={bracket} />
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

      {detail && (
        <PlayerDetail
          userId={detail.user_id}
          name={detail.display_name}
          avatarUrl={detail.avatar_url}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
