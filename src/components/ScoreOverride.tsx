"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  team_a: string;
  team_b: string;
  score_a: number | null;
  score_b: number | null;
  status: string;
  manual: boolean;
};

/** Correction manuelle d'un score par l'orga (quand l'API se trompe). */
export function ScoreOverride({ poolId }: { poolId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [sel, setSel] = useState("");
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("matches")
      .select("id, team_a, team_b, score_a, score_b, status, manual")
      .eq("pool_id", poolId)
      .order("kickoff", { ascending: true });
    setRows((data ?? []) as Row[]);
  }, [poolId]);

  useEffect(() => {
    load();
  }, [load]);

  function pick(id: string) {
    setSel(id);
    setMsg(null);
    const r = rows.find((x) => x.id === id);
    setA(r?.score_a ?? 0);
    setB(r?.score_b ?? 0);
  }
  const cur = rows.find((r) => r.id === sel);

  async function force() {
    if (!sel) return;
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("matches")
      .update({ score_a: a, score_b: b, status: "finished", manual: true })
      .eq("id", sel);
    setBusy(false);
    if (error) return setMsg(`Erreur : ${error.message}`);
    setMsg("Score corrigé ✅ — la synchro auto n'y touchera plus.");
    load();
  }

  async function unlock() {
    if (!sel) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("matches").update({ manual: false }).eq("id", sel);
    setBusy(false);
    setMsg("Rendu à la synchro automatique.");
    load();
  }

  return (
    <Card className="p-5 space-y-3">
      <h2 className="font-semibold">Corriger un score</h2>
      <p className="text-sm text-muted">
        Si l&apos;API se trompe sur un résultat, force le bon score ici. La synchro auto ne touchera
        plus ce match.
      </p>
      <select
        value={sel}
        onChange={(e) => pick(e.target.value)}
        className="h-11 w-full rounded-2xl border border-border bg-surface-2 px-3 outline-none focus:border-accent"
      >
        <option value="">— Choisis un match —</option>
        {rows.map((r) => (
          <option key={r.id} value={r.id}>
            {r.team_a} – {r.team_b}
            {r.manual ? " (corrigé)" : ""}
          </option>
        ))}
      </select>

      {cur && (
        <>
          <div className="flex items-center justify-center gap-2">
            <span className="min-w-0 flex-1 truncate text-right text-sm font-medium">{cur.team_a}</span>
            <input
              type="number"
              min={0}
              value={a}
              onChange={(e) => setA(Math.max(0, Math.floor(+e.target.value) || 0))}
              className="h-12 w-14 rounded-2xl border border-border bg-surface-2 text-center text-lg font-bold outline-none focus:border-accent"
            />
            <span className="text-muted">–</span>
            <input
              type="number"
              min={0}
              value={b}
              onChange={(e) => setB(Math.max(0, Math.floor(+e.target.value) || 0))}
              className="h-12 w-14 rounded-2xl border border-border bg-surface-2 text-center text-lg font-bold outline-none focus:border-accent"
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{cur.team_b}</span>
          </div>
          <Button onClick={force} disabled={busy} className="w-full">
            Forcer ce score
          </Button>
          {cur.manual && (
            <button onClick={unlock} disabled={busy} className="w-full text-center text-[13px] text-muted">
              ↩︎ Rendre à la synchro auto
            </button>
          )}
        </>
      )}
      {msg && <p className="text-center text-sm text-accent">{msg}</p>}
    </Card>
  );
}
