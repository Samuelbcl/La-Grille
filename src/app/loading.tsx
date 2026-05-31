/** Écran de chargement par défaut pendant le rendu serveur des pages. */
export default function Loading() {
  return (
    <div className="px-6 pt-24 text-center text-muted">
      <div className="text-4xl mb-3 animate-pulse">⚽️</div>
      Chargement…
    </div>
  );
}
