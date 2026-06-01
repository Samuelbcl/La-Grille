/**
 * Drapeau en image (via flagcdn.com) à partir d'un code ISO (ex: "fr", "gb-eng").
 * Hauteur fixe, largeur automatique → le drapeau s'affiche toujours en entier
 * (on ne force pas le ratio, donc pas de rognage). `size` = hauteur en px.
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
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      alt=""
      loading="lazy"
      className={`inline-block shrink-0 rounded-[3px] object-contain align-middle ring-1 ring-black/10 ${className}`}
      style={{ height: size, width: "auto" }}
    />
  );
}
