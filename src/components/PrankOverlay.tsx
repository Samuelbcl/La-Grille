"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PRANK } from "@/lib/prank";

/**
 * Écran surprise affiché UNE SEULE FOIS par appareil à l'ouverture.
 * - Aperçu privé : ouvrir l'app avec ?prank=1 → s'affiche sans rien marquer (rejouable).
 * - Publié (PRANK.enabled = true) : s'affiche une fois si pas encore vu, puis jamais.
 */
export function PrankOverlay() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [preview, setPreview] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Décide à l'ouverture s'il faut afficher la surprise.
  useEffect(() => {
    if (pathname === "/login") return;
    let isPreview = false;
    try {
      isPreview = new URLSearchParams(window.location.search).has(PRANK.previewParam);
    } catch {}
    if (isPreview) {
      setPreview(true);
      setShow(true);
      return;
    }
    if (!PRANK.enabled) return; // mode aperçu : personne d'autre ne le voit
    try {
      if (!localStorage.getItem(PRANK.seenKey)) setShow(true);
    } catch {}
  }, [pathname]);

  const close = () => {
    if (!preview) {
      try {
        localStorage.setItem(PRANK.seenKey, "1"); // ne réapparaîtra plus sur cet appareil
      } catch {}
    }
    setShow(false);
  };

  // Fermeture auto : démarre SEULEMENT quand le GIF est affiché, pour qu'une
  // connexion lente ne ferme pas la blague avant qu'on l'ait vue.
  useEffect(() => {
    if (!show || !loaded || PRANK.autoCloseMs <= 0) return;
    const id = setTimeout(close, PRANK.autoCloseMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, loaded]);

  // Pendant l'affichage : verrouille le scroll de fond + fermeture clavier (Échap).
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show) return null;

  return (
    <div
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Surprise"
      className="fixed inset-0 z-[100] grid cursor-pointer place-items-center bg-black/90 px-6 animate-fade-up"
    >
      <div className="flex w-full max-w-sm flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PRANK.gif}
          alt="Surprise"
          onLoad={() => setLoaded(true)}
          onError={close}
          className="w-full rounded-3xl shadow-float"
        />
        {PRANK.caption && (
          <p className="mt-5 text-center text-2xl font-bold text-white">{PRANK.caption}</p>
        )}
        <p className="mt-3 text-[12px] text-white/60">Appuie pour continuer</p>
        {preview && <p className="mt-1 text-[11px] text-white/40">(aperçu privé — non publié)</p>}
      </div>
    </div>
  );
}
