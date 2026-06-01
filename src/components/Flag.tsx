/**
 * Drapeau en image (via flagcdn.com) à partir d'un code ISO (ex: "fr", "gb-eng").
 * Tous les drapeaux ont EXACTEMENT le même gabarit (boîte 3:2) et remplissent le
 * cadre (object-cover) → aucun bord/letterbox, quitte à rogner légèrement.
 * `size` = hauteur en px (largeur = 1,5×).
 */
export function Flag({
  code,
  size = 20,
  className = "",
}: {
  code: string | null;
  size?: number;
  className?: string;
}) {
  const w = Math.round(size * 1.5);

  if (!code) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center align-middle ${className}`}
        style={{ width: w, height: size, fontSize: Math.round(size * 0.85) }}
      >
        🏳️
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      alt={`Drapeau ${code.toUpperCase()}`}
      width={w}
      height={size}
      loading="lazy"
      className={`inline-block shrink-0 rounded-[3px] object-cover align-middle ring-1 ring-black/10 ${className}`}
      style={{ width: w, height: size }}
    />
  );
}
