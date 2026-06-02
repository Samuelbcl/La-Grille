"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

/** Page -> thème (fond + couleurs). Voir globals.css [data-theme]. */
function themeFor(path: string): string {
  if (path === "/") return "calendrier";
  if (path.startsWith("/pronos")) return "pronos";
  if (path.startsWith("/classement")) return "classement";
  if (path.startsWith("/admin")) return "groupe";
  if (path.startsWith("/profil")) return "profil";
  if (path.startsWith("/login")) return "login";
  if (path.startsWith("/regles")) return "pronos";
  return "calendrier";
}

/**
 * Enveloppe l'app : applique le thème de la page (data-theme), pose le fond
 * d'ambiance plein écran, et englobe le contenu + la barre d'onglets (qui
 * hérite ainsi des couleurs de la page). La connexion est en plein écran.
 */
export function ThemeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const theme = themeFor(pathname);
  const fullScreen = pathname === "/login";

  return (
    <div data-theme={theme} className="theme-root">
      <div className="app-bg" aria-hidden />
      <main
        className={`relative z-10 mx-auto min-h-dvh max-w-md ${
          fullScreen ? "" : "pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
        }`}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
