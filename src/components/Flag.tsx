/**
 * Drapeau en image (via flagcdn.com) à partir d'un code ISO alpha-2 (ex: "fr").
 * Plus net que les emojis. `size` = hauteur en px (largeur = 4/3).
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
  if (!code) {
    return (
      <span style={{ fontSize: size }} className={className}>
        🏳️
      </span>
    );
  }
  const w = Math.round((size * 4) / 3);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      alt=""
      width={w}
      height={size}
      loading="lazy"
      className={`inline-block shrink-0 rounded-[3px] object-cover ring-1 ring-black/10 ${className}`}
      style={{ width: w, height: size }}
    />
  );
}
