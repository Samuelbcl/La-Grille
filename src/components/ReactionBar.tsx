"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SmilePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EMOJIS } from "@/lib/emojis";
import type { ReactionCounts } from "@/lib/queries";

/**
 * Barre de réactions emoji visant un JOUEUR : son prono (matchId fourni) ou son
 * rang au classement (matchId omis). Écriture optimiste + temps réel via refresh.
 */
export function ReactionBar({
  poolId,
  targetUserId,
  matchId = null,
  userId,
  initial,
  size = "sm",
}: {
  poolId: string;
  targetUserId: string;
  matchId?: string | null;
  userId: string | null;
  initial: ReactionCounts;
  size?: "sm" | "xs";
}) {
  const router = useRouter();
  const [counts, setCounts] = useState<ReactionCounts>(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const img = size === "xs" ? "h-3.5 w-3.5" : "h-4 w-4";
  const btn = size === "xs" ? "h-5 w-5" : "h-6 w-6";

  async function toggle(key: string) {
    if (busy) return;
    if (!userId) return router.push("/login");
    setOpen(false);
    setBusy(true);
    const mine = !!counts[key]?.mine;

    setCounts((c) => {
      const next: ReactionCounts = { ...c };
      const e = { ...(next[key] ?? { count: 0, mine: false }) };
      if (mine) {
        e.count -= 1;
        e.mine = false;
      } else {
        e.count += 1;
        e.mine = true;
      }
      if (e.count <= 0) delete next[key];
      else next[key] = e;
      return next;
    });

    const supabase = createClient();
    if (mine) {
      let q = supabase
        .from("reactions")
        .delete()
        .eq("pool_id", poolId)
        .eq("reactor_id", userId)
        .eq("target_user_id", targetUserId)
        .eq("emoji", key);
      q = matchId ? q.eq("match_id", matchId) : q.is("match_id", null);
      await q;
    } else {
      await supabase
        .from("reactions")
        .insert({ pool_id: poolId, reactor_id: userId, target_user_id: targetUserId, match_id: matchId, emoji: key });
    }
    setBusy(false);
    router.refresh();
  }

  const active = EMOJIS.filter((e) => (counts[e.key]?.count ?? 0) > 0);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {active.map((e) => (
        <button
          key={e.key}
          onClick={() => toggle(e.key)}
          className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] transition active:scale-95 ${
            counts[e.key].mine ? "border-accent text-accent" : "border-border bg-surface-2"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.src} alt={e.label} className={img} />
          <span className="tabular-nums font-semibold">{counts[e.key].count}</span>
        </button>
      ))}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Réagir"
          className={`grid ${btn} place-items-center rounded-full border border-border bg-surface-2 text-muted transition active:scale-90`}
        >
          <SmilePlus size={size === "xs" ? 12 : 14} />
        </button>
        {open && (
          <div className="absolute bottom-7 left-0 z-30 flex w-[216px] flex-wrap gap-1 rounded-2xl border border-border bg-surface p-2 shadow-float">
            {EMOJIS.map((e) => (
              <button
                key={e.key}
                type="button"
                onClick={() => toggle(e.key)}
                title={e.label}
                className={`rounded-lg p-1 transition active:scale-90 ${counts[e.key]?.mine ? "bg-surface-2" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.src} alt={e.label} className="h-7 w-7" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
