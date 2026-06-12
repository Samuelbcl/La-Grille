"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SmilePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EMOJIS } from "@/lib/emojis";
import type { ReactionCounts } from "@/lib/queries";

const SRC: Record<string, { src: string; label: string }> = Object.fromEntries(
  EMOJIS.map((e) => [e.key, { src: e.src, label: e.label }])
);

export function MatchReactions({
  matchId,
  poolId,
  userId,
  initial,
}: {
  matchId: string;
  poolId: string;
  userId: string | null;
  initial: ReactionCounts;
}) {
  const router = useRouter();
  const [counts, setCounts] = useState<ReactionCounts>(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle(key: string) {
    if (busy) return;
    if (!userId) return router.push("/login");
    setOpen(false);
    setBusy(true);
    const mine = !!counts[key]?.mine;

    // Mise à jour optimiste (retour immédiat).
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
      await supabase.from("match_reactions").delete().match({ match_id: matchId, user_id: userId, emoji: key });
    } else {
      await supabase.from("match_reactions").insert({ match_id: matchId, user_id: userId, pool_id: poolId, emoji: key });
    }
    setBusy(false);
    router.refresh();
  }

  const active = EMOJIS.filter((e) => (counts[e.key]?.count ?? 0) > 0);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {active.map((e) => (
        <button
          key={e.key}
          onClick={() => toggle(e.key)}
          className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] transition active:scale-95 ${
            counts[e.key].mine ? "border-accent text-accent" : "border-border bg-surface-2"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.src} alt={e.label} className="h-4 w-4" />
          <span className="tabular-nums font-semibold">{counts[e.key].count}</span>
        </button>
      ))}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Réagir"
          className="grid h-6 w-6 place-items-center rounded-full border border-border bg-surface-2 text-muted active:scale-90 transition"
        >
          <SmilePlus size={14} />
        </button>
        {open && (
          <div className="absolute bottom-8 left-0 z-20 flex w-[216px] flex-wrap gap-1 rounded-2xl border border-border bg-surface p-2 shadow-float">
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
