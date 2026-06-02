import { teamBackground, teamByCode } from "@/lib/teams";

/**
 * Avatar en carré arrondi : soit l'image perso (personnage entier, object-contain),
 * soit une pastille colorée avec l'initiale en secours. `size` = côté en px.
 * `team` = code drapeau de l'équipe favorite → colore le fond à ses couleurs.
 */
export function avatarColor(s: string): string {
  let h = 0;
  for (const c of s || "?") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 60% 45%)`;
}

export function Avatar({
  url,
  name,
  size = 40,
  className = "",
  team,
}: {
  url?: string | null;
  name: string;
  size?: number;
  className?: string;
  team?: string | null;
}) {
  const radius = Math.round(size * 0.28);

  if (url) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}
        style={{ width: size, height: size, borderRadius: radius, background: teamBackground(team) }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`Avatar de ${name}`} loading="lazy" className="h-full w-full object-contain" />
      </span>
    );
  }

  const t = teamByCode(team);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: t ? `linear-gradient(145deg, ${t.from} 0%, ${t.to} 100%)` : undefined,
        backgroundColor: t ? undefined : avatarColor(name),
        fontSize: Math.round(size * 0.42),
      }}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}
