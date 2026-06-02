"use client";

import { usePathname } from "next/navigation";

/**
 * Conteneur principal. Réserve l'espace de la barre d'onglets en bas… sauf sur
 * la page de connexion, qui doit s'afficher en plein écran (sans onglets).
 */
export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullScreen = pathname === "/login";
  return (
    <main
      className={`mx-auto max-w-md min-h-dvh ${
        fullScreen ? "" : "pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
      }`}
    >
      {children}
    </main>
  );
}
