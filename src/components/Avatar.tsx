/**
 * Avatar en carré arrondi : soit l'image perso (personnage entier, object-contain),
 * soit une pastille colorée avec l'initiale en secours. `size` = côté en px.
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
}: {
  url?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const radius = Math.round(size * 0.28);

  if (url) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden bg-surface-2 ${className}`}
        style={{ width: size, height: size, borderRadius: radius }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" loading="lazy" className="h-full w-full object-contain" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: avatarColor(name),
        fontSize: Math.round(size * 0.42),
      }}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}
