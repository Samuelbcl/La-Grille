"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Users } from "lucide-react";
import { formatKickoff } from "@/lib/utils";
import { computePoints, outcomeOf, POINTS } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Flag } from "@/components/Flag";
import { Avatar } from "@/components/Avatar";

type PeerPred = { name: string; avatarUrl: string | null; a: number; b: number; pts: number; joker: boolean; isMine: boolean };

export interface MatchCardData {
  id: string;
  group_label: string | null;
  stage?: string;
  kickoff: string;
  team_a: string;
  team_a_code: string | null;
  team_b: string;
  team_b_code: string | null;
  score_a: number | null;
  score_b: number | null;
  status: string;
  pred_a?: number | null;
  pred_b?: number | null;
  joker?: boolean;
}

export function MatchCard({
  m,
  userId,
  editable = false,
  jokersLeft = 0,
}: {
  m: MatchCardData;
  userId: string | null;
  editable?: boolean;
  jokersLeft?: number;
}) {
  const router = useRouter();
  const kickoffTs = new Date(m.kickoff).getTime();
  const [nowTs, setNowTs] = useState(() => Date.now());
  // Verrouille pile au coup d'envoi, même si la page reste ouverte sur le tel.
  useEffect(() => {
    const delay = kickoffTs - nowTs;
    if (delay <= 0 || delay > 12 * 3_600_000) return;
    const t = setTimeout(() => setNowTs(Date.now()), delay + 500);
    return () => clearTimeout(t);
  }, [kickoffTs, nowTs]);
  const locked = nowTs >= kickoffTs;
  const finished = m.status === "finished";
  const state: "upcoming" | "live" | "finished" = finished ? "finished" : locked ? "live" : "upcoming";

  // Prono enregistré (état local → retour instantané après "Valider").
  const [predA, setPredA] = useState<number | null>(m.pred_a ?? null);
  const [predB, setPredB] = useState<number | null>(m.pred_b ?? null);
  const hasPred = predA != null && predB != null;
  const [joker, setJoker] = useState(m.joker ?? false);

  // Édition inline.
  const [editing, setEditing] = useState(false);
  // Si le match démarre pendant qu'on édite : on ferme l'éditeur d'office.
  useEffect(() => {
    if (locked && editing) setEditing(false);
  }, [locked, editing]);
  const [a, setA] = useState(predA ?? 0);
  const [b, setB] = useState(predB ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pronos des potes (visibles après le coup d'envoi — RLS anti-triche).
  const [showPeers, setShowPeers] = useState(false);
  const [peers, setPeers] = useState<PeerPred[] | null>(null);
  const [loadingPeers, setLoadingPeers] = useState(false);

  async function togglePeers() {
    if (peers) {
      setShowPeers((s) => !s);
      return;
    }
    setShowPeers(true);
    setLoadingPeers(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("predictions")
      .select("user_id, pred_a, pred_b, joker, profiles(display_name, avatar_url)")
      .eq("match_id", m.id);
    const list: PeerPred[] = (data ?? []).map((p) => {
      const row = p as unknown as {
        user_id: string;
        pred_a: number;
        pred_b: number;
        joker: boolean;
        profiles: { display_name: string; avatar_url: string | null } | null;
      };
      const base = finished ? computePoints(row.pred_a, row.pred_b, m.score_a, m.score_b) : 0;
      return {
        name: row.profiles?.display_name ?? "Joueur",
        avatarUrl: row.profiles?.avatar_url ?? null,
        a: row.pred_a,
        b: row.pred_b,
        pts: base * (row.joker ? 2 : 1),
        joker: row.joker,
        isMine: row.user_id === userId,
      };
    });
    list.sort((x, y) => y.pts - x.pts);
    setPeers(list);
    setLoadingPeers(false);
  }

  // 🎉 Confettis (une seule fois par match) quand TON prono est un score exact.
  useEffect(() => {
    if (state !== "finished" || predA == null || predB == null) return;
    if (!(predA === m.score_a && predB === m.score_b)) return;
    try {
      const key = "lagrille:celebrated";
      const seen: string[] = JSON.parse(localStorage.getItem(key) || "[]");
      if (seen.includes(m.id)) return;
      localStorage.setItem(key, JSON.stringify([...seen, m.id]));
    } catch {}
    import("canvas-confetti")
      .then(({ default: confetti }) =>
        confetti({ particleCount: 110, spread: 75, origin: { y: 0.7 }, colors: ["#0A84FF", "#ffd166", "#ffffff"] })
      )
      .catch(() => {});
  }, [state, predA, predB, m.id, m.score_a, m.score_b]);

  function openEdit() {
    setA(predA ?? 0);
    setB(predB ?? 0);
    setError(null);
    setEditing(true);
  }

  async function save() {
    if (!userId) return router.push("/login");
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: upsertError } = await supabase
      .from("predictions")
      .upsert(
        { match_id: m.id, user_id: userId, pred_a: a, pred_b: b },
        { onConflict: "match_id,user_id" }
      );
    setSaving(false);
    if (upsertError) {
      setError("Échec — le match a peut-être déjà commencé.");
      return;
    }
    setPredA(a);
    setPredB(b);
    setEditing(false);
    import("canvas-confetti")
      .then(({ default: confetti }) =>
        confetti({ particleCount: 45, spread: 55, scalar: 0.8, origin: { y: 0.8 }, colors: ["#0A84FF", "#ffd166", "#ffffff"] })
      )
      .catch(() => {});
    router.refresh(); // met à jour le compteur "à pronostiquer" et le classement
  }

  async function toggleJoker() {
    if (!userId) return router.push("/login");
    const next = !joker;
    if (next && jokersLeft <= 0) return; // plus de jokers disponibles
    setJoker(next);
    const supabase = createClient();
    const { error: e } = await supabase
      .from("predictions")
      .update({ joker: next })
      .eq("match_id", m.id)
      .eq("user_id", userId);
    if (e) return setJoker(!next); // rollback si échec (ex. coup d'envoi passé)
    router.refresh();
  }

  const mult = joker ? 2 : 1;
  const outcome =
    finished && hasPred ? outcomeOf(predA!, predB!, m.score_a, m.score_b) : "pending";
  const badge =
    outcome === "exact"
      ? { text: `${joker ? "🃏 " : ""}Score exact +${POINTS.exact * mult}`, cls: "text-success" }
      : outcome === "correct"
        ? { text: `${joker ? "🃏 " : ""}Bon vainqueur +${POINTS.outcome * mult}`, cls: "text-accent" }
        : outcome === "wrong"
          ? { text: "Raté", cls: "text-muted" }
          : null;

  return (
    <div className="rounded-2xl bg-surface border border-border shadow-card p-4">
      {/* En-tête : groupe · date  +  bouton d'action en haut à droite */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted mb-3">
        <span className="min-w-0 truncate">
          {m.group_label ? `Groupe ${m.group_label} · ` : ""}
          {formatKickoff(m.kickoff)}
        </span>
        {editable && state === "upcoming" && (
          <button
            onClick={() => (editing ? setEditing(false) : openEdit())}
            className="shrink-0 font-medium text-accent"
          >
            {editing ? "Annuler" : hasPred ? "Modifier" : "Pronostiquer"}
          </button>
        )}
        {state === "live" && (
          <span className="shrink-0 inline-flex items-center gap-1 font-semibold text-[#ff3b30]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff3b30] animate-pulse" /> En direct
          </span>
        )}
        {state === "finished" && <span className="shrink-0 font-medium text-muted">Terminé</span>}
      </div>

      {editing ? (
        <div className="space-y-3">
          <EditRow name={m.team_a} code={m.team_a_code} value={a} onChange={setA} />
          <EditRow name={m.team_b} code={m.team_b_code} value={b} onChange={setB} />
          <Button size="md" className="w-full" onClick={save} disabled={saving}>
            {saving ? "Enregistrement…" : "Valider mon prono"}
          </Button>
          {error && <p className="text-center text-sm text-[#ff3b30]">{error}</p>}
        </div>
      ) : (
        <>
          {/* Page Pronos (editable) : on montre TON prono à droite (comme un score).
              Page Calendrier (lecture) : on montre le vrai score. */}
          <Row name={m.team_a} code={m.team_a_code} score={editable ? predA : m.score_a} />
          <div className="h-px bg-border my-2" />
          <Row name={m.team_b} code={m.team_b_code} score={editable ? predB : m.score_b} />

          {editable && hasPred && state === "upcoming" && (
            <button
              onClick={toggleJoker}
              disabled={!joker && jokersLeft <= 0}
              className={`mt-3 flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold transition active:scale-95 disabled:opacity-40 ${
                joker ? "border-warning text-warning" : "border-border text-muted"
              }`}
            >
              🃏 {joker ? "Joker ×2 activé — retirer" : "Jouer un joker ×2"}
            </button>
          )}

          {!editable && hasPred && (
            <div className="mt-3 text-[11px] text-muted">
              Ton prono : <span className="text-text font-semibold">{predA} – {predB}</span>
              {joker && <span className="ml-1 font-semibold text-warning">· 🃏 ×2</span>}
            </div>
          )}
          {badge && <div className={`mt-1 text-[11px] font-semibold ${badge.cls}`}>{badge.text}</div>}
          {!hasPred && locked && (
            <div className="mt-3 text-[11px] text-muted">Tu n&apos;as pas pronostiqué ce match.</div>
          )}

          {/* Pronos des potes — visibles seulement après le coup d'envoi */}
          {locked && (
            <div className="mt-3 border-t border-border pt-3">
              <button
                type="button"
                onClick={togglePeers}
                className="flex items-center gap-1.5 text-[12px] font-medium text-accent"
              >
                <Users size={14} /> {showPeers ? "Masquer les pronos" : "Voir les pronos des potes"}
              </button>
              {showPeers && (
                <div className="mt-2 space-y-1.5">
                  {loadingPeers && <p className="text-[12px] text-muted">Chargement…</p>}
                  {!loadingPeers && peers && peers.length === 0 && (
                    <p className="text-[12px] text-muted">Aucun prono sur ce match.</p>
                  )}
                  {!loadingPeers &&
                    peers?.map((p, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-[13px]">
                        <span className="flex min-w-0 items-center gap-2">
                          <Avatar url={p.avatarUrl} name={p.name} size={20} />
                          <span className={`truncate ${p.isMine ? "font-semibold text-accent" : ""}`}>
                            {p.name}
                            {p.isMine ? " · toi" : ""}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {p.joker && <span title="Joker ×2" className="text-warning">🃏</span>}
                          <span className="tabular-nums font-semibold">
                            {p.a}–{p.b}
                          </span>
                          {finished && (
                            <span className={`tabular-nums text-[11px] ${p.pts > 0 ? "text-success" : "text-muted"}`}>
                              +{p.pts}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Row({
  name,
  code,
  score,
}: {
  name: string;
  code: string | null;
  score: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <Flag code={code} size={22} />
        <span className="font-semibold text-[15px] truncate">{name}</span>
      </div>
      <span className="tabular-nums text-lg font-bold w-7 text-right shrink-0">
        {score != null ? score : "–"}
      </span>
    </div>
  );
}

function EditRow({
  name,
  code,
  value,
  onChange,
}: {
  name: string;
  code: string | null;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Flag code={code} size={22} />
      <span className="flex-1 min-w-0 truncate font-semibold text-[15px]">{name}</span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          aria-label={`Moins — ${name}`}
          disabled={value <= 0}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="grid place-items-center h-9 w-9 rounded-full bg-surface-2 border border-border active:scale-90 transition disabled:opacity-30"
        >
          <Minus size={16} />
        </button>
        <span className="tabular-nums text-xl font-bold w-6 text-center">{value}</span>
        <button
          type="button"
          aria-label={`Plus — ${name}`}
          disabled={value >= 20}
          onClick={() => onChange(value + 1)}
          className="grid place-items-center h-9 w-9 rounded-full bg-surface-2 border border-border active:scale-90 transition disabled:opacity-30"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
