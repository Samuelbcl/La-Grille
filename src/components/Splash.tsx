"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * Écran d'ouverture (au lieu de l'écran noir au lancement de la PWA).
 * Affiché dès le rendu, puis disparaît en fondu après un court instant.
 */
export function Splash() {
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHidden(true), 900);
    const t2 = setTimeout(() => setRemoved(true), 1450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (removed) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center transition-opacity duration-500 ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ background: "linear-gradient(160deg, #0a1f4d 0%, #1565e6 100%)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/icon-192.png"
          alt="La Grille"
          width={96}
          height={96}
          priority
          className="rounded-[22px] shadow-float"
        />
        <span className="text-xl font-bold tracking-tight text-white">La Grille</span>
        <span className="mt-1 h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    </div>
  );
}
