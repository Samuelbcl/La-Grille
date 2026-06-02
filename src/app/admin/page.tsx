"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/Avatar";
import { SEED_MATCHES } from "@/data/matches";
import { Copy, Check } from "lucide-react";

type Pool = {
  id: string;
  name: string;
  join_code: string;
  is_admin: boolean;
};
type Member = { userId: string; name: string; avatarUrl: string | null; team: string | null; isAdmin: boolean };

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [pool, setPool] = useState<Pool | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [matchCount, setMatchCount] = useState(0);
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
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pm?.pools) {
      const p = pm.pools as unknown as Omit<Pool, "is_admin">;
      setPool({ ...p, is_admin: pm.is_admin });

      const { count } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("pool_id", p.id);
      setMatchCount(count ?? 0);

      const { data: mem } = await supabase
        .from("pool_members")
        .select("user_id, is_admin, profiles(display_name, avatar_url, fav_team)")
        .eq("pool_id", p.id);
      const rows = (mem ?? []) as unknown as Array<{
        user_id: string;
        is_admin: boolean;
        profiles: { display_name: string; avatar_url: string | null; fav_team: string | null } | null;
      }>;
      setMembers(
        rows
          .map((r) => ({
            userId: r.user_id,
            name: r.profiles?.display_name ?? "Joueur",
            avatarUrl: r.profiles?.avatar_url ?? null,
            team: r.profiles?.fav_team ?? null,
            isAdmin: r.is_admin,
          }))
          .sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin))
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
    if (error) return setMsg(`Erreur : ${error.message}`);
    await supabase.from("pool_members").insert({ pool_id: p.id, user_id: userId, is_admin: true });
    setPoolName("");
    load();
  }

  async function joinPool() {
    if (!userId || !code) return;
    const { error } = await supabase.rpc("join_pool", { p_code: code });
    if (error) {
      return setMsg(error.message.includes("introuvable") ? "Code introuvable." : `Erreur : ${error.message}`);
    }
    setCode("");
    load();
  }

  async function importMatches() {
    if (!pool) return;
    const rows = SEED_MATCHES.map((m) => ({ ...m, pool_id: pool.id }));
    const { error } = await supabase.from("matches").upsert(rows, { onConflict: "pool_id,match_no" });
    setMsg(error ? `Erreur : ${error.message}` : `${rows.length} matchs importés ✅`);
    load();
  }

  async function deletePool() {
    if (!pool) return;
    if (!confirm(`Supprimer le groupe « ${pool.name} » ? Tous les matchs, pronos et le classement seront perdus.`))
      return;
    if (!confirm("Confirmer : cette suppression est définitive.")) return;
    const { error } = await supabase.from("pools").delete().eq("id", pool.id);
    if (error) return setMsg(`Erreur : ${error.message}`);
    setPool(null);
    setMatchCount(0);
    setMsg(null);
    load();
  }

  if (loading)
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+18px)] space-y-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
    );

  const msgClass = msg && (msg.startsWith("Erreur") || msg === "Code introuvable.") ? "text-[#ff3b30]" : "text-accent";

  // --- Aucun pool : créer ou rejoindre ---
  if (!pool) {
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+18px)] space-y-6">
        <h1 className="text-2xl font-bold">Mon groupe</h1>
        {msg && <p className={`text-sm ${msgClass}`}>{msg}</p>}

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Créer un groupe</h2>
          <p className="text-sm text-muted">Tu deviens l&apos;organisateur du groupe.</p>
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
          <h2 className="font-semibold">Rejoindre un groupe</h2>
          <p className="text-sm text-muted">Avec le code à 6 caractères de l&apos;organisateur.</p>
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
      <h1 className="text-2xl font-bold">Groupe</h1>
      {msg && <p className={`text-sm ${msgClass}`}>{msg}</p>}

      {/* Membres du groupe (visibles par tous) */}
      <Card className="p-5">
        <h2 className="font-semibold mb-3">
          {pool.name} · {members.length} membre{members.length > 1 ? "s" : ""}
        </h2>
        <div className="space-y-2.5">
          {members.map((mem) => (
            <div key={mem.userId} className="flex items-center gap-3">
              <Avatar url={mem.avatarUrl} name={mem.name} team={mem.team} size={36} />
              <span className="min-w-0 flex-1 truncate font-medium">{mem.name}</span>
              {mem.isAdmin && (
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-accent">
                  Organisateur
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {pool.is_admin ? (
        <>
          {/* Code d'invitation (admin uniquement) */}
          <Card className="p-5">
            <p className="text-sm text-muted mb-1">Code d&apos;invitation</p>
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
            <p className="text-xs text-muted mt-2">Partage ce code à tes potes pour qu&apos;ils rejoignent.</p>
          </Card>

          {/* Import des matchs */}
          {matchCount === 0 ? (
            <Card className="p-5 space-y-3">
              <h2 className="font-semibold">Importer les matchs</h2>
              <p className="text-sm text-muted">
                Charge les 72 matchs de la phase de poules (calendrier officiel).
              </p>
              <Button onClick={importMatches} className="w-full">
                Importer les matchs
              </Button>
            </Card>
          ) : (
            <Card className="p-5 space-y-3">
              <h2 className="font-semibold">Résultats</h2>
              <p className="text-sm text-muted">
                ✅ {matchCount} matchs chargés. Les scores se remplissent{" "}
                <b>automatiquement</b> dès qu&apos;un match est terminé, et le classement se met à
                jour tout seul — rien à saisir.
              </p>
              <Button variant="secondary" onClick={importMatches} className="w-full">
                Mettre à jour les matchs
              </Button>
              <p className="text-xs text-muted">
                Rafraîchit équipes, drapeaux et horaires depuis le calendrier officiel (sans toucher
                aux pronos ni aux scores déjà saisis).
              </p>
            </Card>
          )}

          {/* Zone de danger : supprimer le groupe */}
          <Card className="p-5 space-y-3">
            <h2 className="font-semibold text-[#ff3b30]">Zone de danger</h2>
            <p className="text-sm text-muted">
              Supprime définitivement ce groupe (matchs, pronos et classement). Pour repartir de zéro.
            </p>
            <Button variant="danger" onClick={deletePool} className="w-full">
              Supprimer ce groupe
            </Button>
          </Card>
        </>
      ) : (
        <Card className="p-5">
          <p className="text-sm text-muted">
            C&apos;est l&apos;organisateur qui gère le groupe (matchs, résultats…). Pour te
            déconnecter, va dans l&apos;onglet <b>Profil</b>.
          </p>
        </Card>
      )}
    </div>
  );
}
