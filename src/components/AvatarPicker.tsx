"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// On tente avatar-1.png … avatar-12.png ; ceux qui n'existent pas se masquent (onError).
const CANDIDATES = Array.from({ length: 12 }, (_, i) => `/avatars/avatar-${i + 1}.png`);

export function AvatarPicker({ current }: { current: string | null }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(current);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  async function choose(url: string) {
    if (saving) return;
    setSelected(url);
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setSaving(false);
    router.refresh();
  }

  const allHidden = CANDIDATES.every((u) => hidden[u]);

  return (
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
                onClick={() => choose(url)}
                className={`relative aspect-square overflow-hidden rounded-2xl bg-surface-2 transition active:scale-95 ${
                  selected === url ? "ring-2 ring-accent" : "border border-border"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
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
  );
}
