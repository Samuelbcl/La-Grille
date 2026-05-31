"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

/** Partage le classement via le partage natif (ou copie dans le presse-papier). */
export function ShareButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const full = `${text}\n${url}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "La Grille", text: full });
        return;
      }
    } catch {
      return; // l'utilisateur a annulé le partage
    }
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <button onClick={share} className="flex items-center gap-1 text-sm font-medium text-accent">
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Copié" : "Partager"}
    </button>
  );
}
