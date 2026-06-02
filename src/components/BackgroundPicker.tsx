"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { THEME_KEY, THEME_EVENT } from "@/components/ThemeShell";

// "auto" = un fond par page ; "classic" = blanc/noir selon le mode du téléphone ;
// sinon un fond d'ambiance unique pour toute l'app.
type Opt = { key: string; label: string; img?: string; bg?: string };
const OPTIONS: Opt[] = [
  { key: "auto", label: "Auto", bg: "linear-gradient(135deg,#2e90ff,#2ecf73,#ff5b4e)" },
  { key: "classic", label: "Classique", bg: "linear-gradient(135deg,#f5f5f7 0 50%,#161618 50% 100%)" },
  { key: "pronos", label: "Bleu", img: "/bg/pronos.webp" },
  { key: "classement", label: "Vert", img: "/bg/classement.webp" },
  { key: "profil", label: "Rouge", img: "/bg/profil.webp" },
  { key: "groupe", label: "Sombre", img: "/bg/groupe.webp" },
  { key: "calendrier", label: "Clair", img: "/bg/calendrier.webp" },
];

export function BackgroundPicker() {
  const [sel, setSel] = useState<string>("auto");

  useEffect(() => {
    try {
      setSel(localStorage.getItem(THEME_KEY) || "auto");
    } catch {}
  }, []);

  function choose(key: string) {
    setSel(key);
    try {
      localStorage.setItem(THEME_KEY, key);
    } catch {}
    // Applique tout de suite à toute l'app (ThemeShell écoute cet événement).
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <div>
      <p className="mb-3 text-[12px] text-muted">
        S&apos;applique partout et reste enregistré. « Auto » = un fond par onglet ·
        « Classique » = blanc/noir selon ton téléphone.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => choose(o.key)}
            className={`relative aspect-[3/4] overflow-hidden rounded-xl transition active:scale-95 ${
              sel === o.key ? "ring-2 ring-accent" : "border border-border"
            }`}
          >
            {o.img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.img} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <span className="block h-full w-full" style={{ background: o.bg }} />
            )}
            <span className="absolute inset-x-0 bottom-0 bg-black/45 py-0.5 text-center text-[10px] font-medium text-white">
              {o.label}
            </span>
            {sel === o.key && (
              <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-white">
                <Check size={12} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
