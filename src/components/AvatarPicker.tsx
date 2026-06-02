"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TEAMS, teamByCode } from "@/lib/teams";

// On tente avatar-1.png … avatar-12.png ; ceux qui n'existent pas se masquent (onError).
const CANDIDATES = Array.from({ length: 12 }, (_, i) => `/avatars/avatar-${i + 1}.png`);

export function AvatarPicker({
  current,
  currentTeam,
}: {
  current: string | null;
  currentTeam: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(current);
  const [team, setTeam] = useState<string | null>(currentTeam);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  async function update(patch: { avatar_url?: string; fav_team?: string | null }) {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update(patch).eq("id", user.id);
    setSaving(false);
    router.refresh();
  }

  function chooseAvatar(url: string) {
    if (saving) return;
    setSelected(url);
    update({ avatar_url: url });
  }

  function chooseTeam(code: string | null) {
    if (saving) return;
    const next = team === code ? null : code; // re-tap = retire
    setTeam(next);
    update({ fav_team: next });
  }

  const allHidden = CANDIDATES.every((u) => hidden[u]);
  const teamName = teamByCode(team)?.name;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold">Choisis ton avatar</p>
        {allHidden ? (
          <p className="text-[13px] text-muted">
            Aucun avatar disponible pour l&apos;instant. (Dépose des images dans public/avatars/.)
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {CANDIDATES.map((url) =>
              hidden[url] ? null : (
                <button
                  key={url}
                  onClick={() => chooseAvatar(url)}
                  className={`relative aspect-square overflow-hidden rounded-2xl bg-surface-2 transition active:scale-95 ${
                    selected === url ? "ring-2 ring-accent" : "border border-border"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-contain p-1"
                    onError={() => setHidden((h) => ({ ...h, [url]: true }))}
                  />
                  {selected === url && (
                    <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-white">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              )
            )}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-sm font-semibold">Couleurs de ton équipe</p>
          {teamName && <span className="text-[12px] font-medium text-muted">{teamName}</span>}
        </div>
        <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1">
          {TEAMS.map((t) => (
            <button
              key={t.code}
              onClick={() => chooseTeam(t.code)}
              className={`flex flex-col items-center gap-1 rounded-xl p-1.5 transition active:scale-95 ${
                team === t.code ? "ring-2 ring-accent" : "border border-border"
              }`}
            >
              <span
                className="relative block h-8 w-full rounded-lg"
                style={{ background: `linear-gradient(145deg, ${t.from} 0%, ${t.to} 100%)` }}
              >
                {team === t.code && (
                  <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-white/90 text-accent">
                    <Check size={11} />
                  </span>
                )}
              </span>
              <span className="w-full truncate text-center text-[11px] font-medium leading-tight">{t.name}</span>
            </button>
          ))}
        </div>
        {team && (
          <button onClick={() => chooseTeam(team)} className="mt-2 text-[12px] font-medium text-muted">
            Retirer les couleurs
          </button>
        )}
      </div>
    </div>
  );
}
