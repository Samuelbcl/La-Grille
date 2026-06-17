"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";

export const THEME_KEY = "lagrille:theme";
export const THEME_EVENT = "lagrille:themechange";

/** Page -> thème par défaut (fond + couleurs). Voir globals.css [data-theme]. */
function themeFor(path: string): string {
  if (path === "/") return "calendrier";
  if (path.startsWith("/pronos") || path.startsWith("/bonus")) return "pronos";
  if (path.startsWith("/classement")) return "classement";
  if (path.startsWith("/admin")) return "groupe";
  if (path.startsWith("/profil")) return "profil";
  if (path.startsWith("/login")) return "login";
  if (path.startsWith("/regles")) return "pronos";
  return "calendrier";
}

/**
 * Enveloppe l'app : applique le thème (data-theme), pose le fond d'ambiance
 * plein écran, et englobe le contenu + la barre d'onglets (qui hérite des
 * couleurs de la page). Si l'utilisateur a choisi un fond (localStorage), il
 * s'applique à TOUTE l'app ; sinon c'est le fond par défaut de chaque page.
 */
export function ThemeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userTheme, setUserTheme] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      try {
        const t = localStorage.getItem(THEME_KEY);
        setUserTheme(t && t !== "auto" ? t : null);
      } catch {
        setUserTheme(null);
      }
    };
    read();
    window.addEventListener(THEME_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(THEME_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const theme = userTheme ?? themeFor(pathname);
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
