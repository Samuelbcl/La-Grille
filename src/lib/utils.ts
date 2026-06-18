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

/** Fuseau de référence (public français) — le serveur tourne en UTC. */
export const TZ = "Europe/Paris";

/** Date courte FR : "mar. 16 juin · 21:00" (heure de Paris) */
export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TZ,
  });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
  return `${day} · ${time}`;
}

export function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  });
}

/** Identifiant de jour "AAAA-MM-JJ" en heure de Paris (regroupement fiable). */
export function dayId(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}
export function todayId(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Libellés courts pour la barre de jours (heure de Paris). */
export function chipWeekday(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", timeZone: TZ }).replace(".", "");
}
export function chipDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", timeZone: TZ });
}

/** État d'un match : à venir, en cours (coup d'envoi passé, pas de résultat), terminé. */
export function matchState(kickoff: string, status: string): "upcoming" | "live" | "finished" {
  if (status === "finished") return "finished";
  return new Date(kickoff) <= new Date() ? "live" : "upcoming";
}

/** Vrai si l'ISO tombe aujourd'hui (heure de Paris). */
export function isToday(iso: string): boolean {
  return dayId(iso) === todayId();
}
