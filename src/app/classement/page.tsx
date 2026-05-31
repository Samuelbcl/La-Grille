import { getCurrentPool, getLeaderboard } from "@/lib/queries";
import { ShareButton } from "@/components/ShareButton";
import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

type LbRow = {
  user_id: string;
  display_name: string;
  total_points: number;
  exact_count: number;
  correct_count: number;
  played_count: number;
};

const MEDALS = ["🥇", "🥈", "🥉"];

function avatarColor(s: string): string {
  let h = 0;
  for (const c of s || "?") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 60% 45%)`;
}

function PodiumSpot({ row, place, me }: { row: LbRow; place: 1 | 2 | 3; me: boolean }) {
  const avatar = place === 1 ? "h-16 w-16 text-2xl" : "h-14 w-14 text-xl";
  const ped = place === 1 ? "h-20" : place === 2 ? "h-14" : "h-10";
  return (
    <div className="flex w-1/3 flex-col items-center">
      <div className="text-2xl">{MEDALS[place - 1]}</div>
      <span
        className={`mt-1 grid ${avatar} place-items-center rounded-full font-bold text-white ${me ? "ring-2 ring-accent" : ""}`}
        style={{ backgroundColor: avatarColor(row.display_name) }}
      >
        {(row.display_name || "?").charAt(0).toUpperCase()}
      </span>
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
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-card ${me ? "border-accent" : "border-border bg-surface"}`}
    >
      <span className="w-5 text-center text-sm font-bold tabular-nums text-muted">{rank}</span>
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: avatarColor(row.display_name) }}
      >
        {(row.display_name || "?").charAt(0).toUpperCase()}
      </span>
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

export default async function ClassementPage() {
  const pool = await getCurrentPool();
  if (!pool) {
    return <div className="px-6 pt-24 text-center text-muted">Rejoins un pool pour voir le classement.</div>;
  }

  const rows = (await getLeaderboard(pool.id)) as LbRow[];
  const me = pool.user_id as string;
  const top = rows.slice(0, 3);
  const rest = rows.slice(3);

  const shareText =
    `🏆 ${pool.name} — La Grille\n` +
    rows.slice(0, 5).map((r, i) => `${MEDALS[i] ?? `${i + 1}.`} ${r.display_name} — ${r.total_points} pts`).join("\n") +
    `\nRejoins-nous 👇`;

  return (
    <>
      <header className="glass sticky top-0 z-30 px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-bold tracking-tight">Classement</h1>
          {rows.length > 0 && <ShareButton text={shareText} />}
        </div>
        <p className="text-[13px] text-muted">
          {rows.length} joueur{rows.length > 1 ? "s" : ""}
        </p>
      </header>

      <div className="px-4 py-4">
        {rows.length === 0 ? (
          <div className="pt-16 text-center text-muted">
            <Trophy className="mx-auto mb-3" size={32} />
            Le classement s&apos;affichera dès les premiers résultats.
          </div>
        ) : (
          <>
            {/* Podium top 3 */}
            <div className="mb-5 flex items-end justify-center gap-2 pt-1">
              {top[1] && <PodiumSpot row={top[1]} place={2} me={top[1].user_id === me} />}
              {top[0] && <PodiumSpot row={top[0]} place={1} me={top[0].user_id === me} />}
              {top[2] && <PodiumSpot row={top[2]} place={3} me={top[2].user_id === me} />}
            </div>

            {/* Reste du classement */}
            {rest.length > 0 && (
              <div className="space-y-2">
                {rest.map((r, i) => (
                  <RankRow key={r.user_id} row={r} rank={i + 4} me={r.user_id === me} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
