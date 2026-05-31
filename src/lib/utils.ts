import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Drapeau emoji à partir d'un code pays ISO alpha-2 (ex: "fr" -> 🇫🇷). */
export function flag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "🏳️";
  const A = 0x1f1e6;
  return String.fromCodePoint(
    ...code.toUpperCase().split("").map((c) => A + c.charCodeAt(0) - 65)
  );
}

/** Date courte FR : "mar. 16 juin · 21:00" */
export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time}`;
}

export function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
