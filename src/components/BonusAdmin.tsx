"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { BONUS } from "@/lib/bonus";

type Team = { code: string; name: string };

/** Saisie des bonnes réponses bonus par l'organisateur (quand elles sont connues). */
export function BonusAdmin({ poolId }: { poolId: string }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [results, setResults] = useState<Record<string, string>>({});
  const [text, setText] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [{ data: m }, { data: r }] = await Promise.all([
        supabase.from("matches").select("team_a, team_a_code, team_b, team_b_code").eq("pool_id", poolId).eq("stage", "group"),
        supabase.from("bonus_results").select("question_key, answer").eq("pool_id", poolId),
      ]);
      const map = new Map<string, string>();
      for (const x of m ?? []) {
        if (x.team_a && !map.has(x.team_a)) map.set(x.team_a, x.team_a_code ?? "");
        if (x.team_b && !map.has(x.team_b)) map.set(x.team_b, x.team_b_code ?? "");
      }
      setTeams([...map.entries()].map(([name, code]) => ({ name, code })).sort((a, b) => a.name.localeCompare(b.name, "fr")));
      const rr: Record<string, string> = {};
      for (const x of r ?? []) rr[x.question_key] = x.answer;
      setResults(rr);
      setText(rr);
    })();
  }, [poolId]);

  async function save(key: string, answer: string) {
    setResults((s) => ({ ...s, [key]: answer }));
    const supabase = createClient();
    if (answer.trim()) {
      await supabase
        .from("bonus_results")
        .upsert({ pool_id: poolId, question_key: key, answer: answer.trim() }, { onConflict: "pool_id,question_key" });
    } else {
      await supabase.from("bonus_results").delete().eq("pool_id", poolId).eq("question_key", key);
    }
    setSaved(key);
    setTimeout(() => setSaved((s) => (s === key ? null : s)), 1500);
  }

  return (
    <Card className="p-5 space-y-3">
      <h2 className="font-semibold">Réponses bonus</h2>
      <p className="text-sm text-muted">
        Saisis la bonne réponse quand elle est connue (fin du tournoi) → les points s&apos;ajoutent au classement.
      </p>
      <div className="space-y-3">
        {BONUS.map((b) => (
          <div key={b.key}>
            <label className="mb-1 block text-[13px] font-medium">
              {b.label} <span className="text-muted">(+{b.points})</span>
            </label>
            {b.kind === "team" ? (
              <select
                value={results[b.key] ?? ""}
                onChange={(e) => save(b.key, e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-surface-2 px-3 outline-none focus:border-accent"
              >
                <option value="">— Pas encore —</option>
                {teams.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  value={text[b.key] ?? ""}
                  onChange={(e) => setText((s) => ({ ...s, [b.key]: e.target.value }))}
                  placeholder="Nom du buteur"
                  className="h-11 flex-1 rounded-2xl border border-border bg-surface-2 px-4 outline-none focus:border-accent"
                />
                <button
                  onClick={() => save(b.key, text[b.key] ?? "")}
                  className="shrink-0 rounded-2xl bg-accent px-4 text-sm font-semibold text-accent-fg"
                >
                  OK
                </button>
              </div>
            )}
            {saved === b.key && (
              <p className="mt-1 flex items-center gap-1 text-[12px] text-success">
                <Check size={13} /> Enregistré
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
