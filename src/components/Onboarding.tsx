"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ListChecks, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "lagrille:onboarded";

function Step({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-accent">
        {icon}
      </span>
      <div>
        <p className="text-[15px] font-semibold">{title}</p>
        <p className="text-[13px] text-muted">{text}</p>
      </div>
    </div>
  );
}

/** Petit guide affiché une seule fois, au premier lancement. */
export function Onboarding() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (pathname === "/login") return;
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {}
  }, [pathname]);

  if (!show) return null;

  function done() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setShow(false);
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 px-6">
      <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-float animate-fade-up">
        <h2 className="text-center text-xl font-bold">Bienvenue sur La Grille ⚽️</h2>
        <p className="mt-1 text-center text-sm text-muted">
          Pronostique la Coupe du Monde 2026, chambre tes potes.
        </p>
        <div className="mt-5 space-y-3">
          <Step
            icon={<ListChecks size={18} />}
            title="Pronostique"
            text="Mets ton score pour chaque match, jusqu'au coup d'envoi."
          />
          <Step
            icon={<Sparkles size={18} />}
            title="Marque des points"
            text="Bon vainqueur : 2 pts. Score exact : 7 pts."
          />
          <Step
            icon={<Trophy size={18} />}
            title="Grimpe au classement"
            text="Tout est calculé automatiquement. Vise le haut du classement !"
          />
        </div>
        <Button className="mt-6 w-full" onClick={done}>
          C&apos;est parti
        </Button>
      </div>
    </div>
  );
}
