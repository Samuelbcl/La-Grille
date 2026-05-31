"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEED_MATCHES } from "@/data/matches";
import { flag, formatKickoff } from "@/lib/utils";
import { LogOut, Copy, Check } from "lucide-react";

type Pool = {
  id: string;
  name: string;
  join_code: string;
  buy_in_cents: number;
  is_admin: boolean;
};
type Match = {
  id: string;
  kickoff: string;
  team_a: string;
  team_a_code: string | null;
  team_b: string;
  team_b_code: string | null;
  score_a: number | null;
  score_b: number | null;
  status: string;
};
type Member = { user_id: string; has_paid: boolean; display_name: string };

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [pool, setPool] = useState<Pool | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // formulaires
  const [poolName, setPoolName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/login");
    setUserId(user.id);

    const { data: pm } = await supabase
      .from("pool_members")
      .select("pool_id, is_admin, pools(*)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (pm?.pools) {
      const p = pm.pools as unknown as Omit<Pool, "is_admin">;
      setPool({ ...p, is_admin: pm.is_admin });

      const { data: ms } = await supabase
        .from("matches")
        .select("*")
        .eq("pool_id", p.id)
        .order("kickoff");
      setMatches((ms ?? []) as Match[]);

      const { data: mem } = await supabase
        .from("pool_members")
        .select("user_id, has_paid, profiles(display_name)")
        .eq("pool_id", p.id);
      setMembers(
        (mem ?? []).map((m: any) => ({
          user_id: m.user_id,
          has_paid: m.has_paid,
          display_name: m.profiles?.display_name ?? "Joueur",
        }))
      );
    } else {
      setPool(null);
    }
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function createPool() {
    if (!userId || !poolName) return;
    const { data: p, error } = await supabase
      .from("pools")
      .insert({ name: poolName, owner_id: userId })
      .select()
      .single();
    if (error) return setMsg(error.message);
    await supabase.from("pool_members").insert({ pool_id: p.id, user_id: userId, is_admin: true });
    load();
  }

  async function joinPool() {
    if (!userId || !code) return;
    const { data: p, error } = await supabase
      .from("pools")
      .select("id")
      .eq("join_code", code.toUpperCase())
      .maybeSingle();
    if (error || !p) return setMsg("Code introuvable.");
    await supabase.from("pool_members").insert({ pool_id: p.id, user_id: userId });
    load();
  }

  async function importMatches() {
    if (!pool) return;
    const rows = SEED_MATCHES.map((m) => ({ ...m, pool_id: pool.id }));
    const { error } = await supabase.from("matches").upsert(rows, { onConflict: "pool_id,match_no" });
    setMsg(error ? error.message : `${rows.length} matchs importés ✅`);
    load();
  }

  async function saveResult(m: Match, a: number, b: number) {
    // Garde-fou : scores entiers positifs uniquement (l'input peut renvoyer NaN).
    const sa = Number.isFinite(a) ? Math.max(0, Math.floor(a)) : 0;
    const sb = Number.isFinite(b) ? Math.max(0, Math.floor(b)) : 0;
    const { error } = await supabase
      .from("matches")
      .update({ score_a: sa, score_b: sb, status: "finished" })
      .eq("id", m.id);
    setMsg(error ? `Erreur : ${error.message}` : `Résultat enregistré : ${m.team_a} ${sa}–${sb} ${m.team_b} ✅`);
    load();
  }

  async function togglePaid(mem: Member) {
    if (!pool) return;
    await supabase
      .from("pool_members")
      .update({ has_paid: !mem.has_paid })
      .eq("pool_id", pool.id)
      .eq("user_id", mem.user_id);
    load();
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) return <div className="px-6 pt-24 text-center text-muted">Chargement…</div>;

  // --- Aucun pool : créer ou rejoindre ---
  if (!pool) {
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+18px)] space-y-6">
        <h1 className="text-2xl font-bold">Mon pool</h1>
        {msg && (
        <p className={`text-sm ${msg.startsWith("Erreur") || msg === "Code introuvable." ? "text-[#ff3b30]" : "text-accent"}`}>
          {msg}
        </p>
      )}

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Créer un pool</h2>
          <p className="text-sm text-muted">Tu deviens l'organisateur (saisie des résultats).</p>
          <input
            value={poolName}
            onChange={(e) => setPoolName(e.target.value)}
            placeholder="Ex : Pronos de la famille"
            className="w-full h-12 rounded-2xl border border-border bg-surface-2 px-4 outline-none focus:border-accent"
          />
          <Button onClick={createPool} disabled={!poolName} className="w-full">
            Créer
          </Button>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Rejoindre un pool</h2>
          <p className="text-sm text-muted">Avec le code à 6 caractères de l'organisateur.</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="w-full h-12 rounded-2xl border border-border bg-surface-2 px-4 outline-none focus:border-accent tracking-widest font-mono"
          />
          <Button variant="secondary" onClick={joinPool} disabled={!code} className="w-full">
            Rejoindre
          </Button>
        </Card>
      </div>
    );
  }

  // --- Pool existant ---
  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+18px)] space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gérer</h1>
        <button onClick={signOut} className="flex items-center gap-1 text-sm text-muted">
          <LogOut size={16} /> Déconnexion
        </button>
      </div>
      {msg && (
        <p className={`text-sm ${msg.startsWith("Erreur") || msg === "Code introuvable." ? "text-[#ff3b30]" : "text-accent"}`}>
          {msg}
        </p>
      )}

      {/* Code d'invitation */}
      <Card className="p-5">
        <p className="text-sm text-muted mb-1">Code d'invitation</p>
        <div className="flex items-center justify-between">
          <span className="text-3xl font-mono font-bold tracking-widest">{pool.join_code}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(pool.join_code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex items-center gap-1 text-accent font-medium"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? "Copié" : "Copier"}
          </button>
        </div>
        <p className="text-xs text-muted mt-2">Partage ce code à tes potes pour qu'ils rejoignent.</p>
      </Card>

      {/* Paiements */}
      <section>
        <h2 className="font-semibold mb-2">Mises ({pool.buy_in_cents / 100} € / pers.)</h2>
        <Card className="divide-y divide-border">
          {members.map((mem) => (
            <button
              key={mem.user_id}
              disabled={!pool.is_admin}
              onClick={() => togglePaid(mem)}
              className="flex w-full items-center justify-between px-4 py-3 disabled:opacity-100"
            >
              <span className="font-medium">{mem.display_name}</span>
              <span
                className={`text-sm font-semibold ${mem.has_paid ? "text-success" : "text-warning"}`}
              >
                {mem.has_paid ? "Payé ✓" : "En attente"}
              </span>
            </button>
          ))}
        </Card>
      </section>

      {pool.is_admin && (
        <>
          {/* Import des matchs */}
          {matches.length === 0 && (
            <Card className="p-5 space-y-3">
              <h2 className="font-semibold">Importer les matchs</h2>
              <p className="text-sm text-muted">
                Charge les 72 matchs de la phase de poules (calendrier officiel). L'import
                est idempotent : tu peux le relancer après une correction dans src/data/matches.ts.
              </p>
              <Button onClick={importMatches} className="w-full">
                Importer les matchs
              </Button>
            </Card>
          )}

          {/* Saisie des résultats */}
          {matches.length > 0 && (
            <section>
              <h2 className="font-semibold mb-2">Saisir les résultats</h2>
              <div className="space-y-2">
                {matches.map((m) => (
                  <ResultRow key={m.id} m={m} onSave={saveResult} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ResultRow({
  m,
  onSave,
}: {
  m: Match;
  onSave: (m: Match, a: number, b: number) => void;
}) {
  const [a, setA] = useState(m.score_a ?? 0);
  const [b, setB] = useState(m.score_b ?? 0);
  const done = m.status === "finished";

  return (
    <Card className="flex items-center gap-2 px-3 py-2.5">
      <div className="flex-1 min-w-0 text-sm">
        <div className="text-[11px] text-muted">{formatKickoff(m.kickoff)}</div>
        <div className="truncate">
          {flag(m.team_a_code)} {m.team_a} – {m.team_b} {flag(m.team_b_code)}
        </div>
      </div>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={a}
        onChange={(e) => setA(Math.max(0, Math.floor(+e.target.value || 0)))}
        className="w-11 h-10 rounded-xl border border-border bg-surface-2 text-center tabular-nums"
      />
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={b}
        onChange={(e) => setB(Math.max(0, Math.floor(+e.target.value || 0)))}
        className="w-11 h-10 rounded-xl border border-border bg-surface-2 text-center tabular-nums"
      />
      <Button size="sm" variant={done ? "secondary" : "primary"} onClick={() => onSave(m, a, b)}>
        {done ? "Maj" : "OK"}
      </Button>
    </Card>
  );
}
