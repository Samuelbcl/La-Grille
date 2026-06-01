/**
 * Drapeau en image (via flagcdn.com) à partir d'un code ISO (ex: "fr", "gb-eng").
 * Tous les drapeaux ont le MÊME gabarit (boîte 3:2) et sont affichés EN ENTIER
 * (object-contain → aucun rognage). `size` = hauteur en px (largeur = 1,5×).
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
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[3px] bg-surface-2 align-middle ring-1 ring-black/10 ${className}`}
      style={{ width: w, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
        alt=""
        loading="lazy"
        className="h-full w-full object-contain"
      />
    </span>
  );
}
