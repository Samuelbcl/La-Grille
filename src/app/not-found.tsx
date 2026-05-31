import Link from "next/link";

/** Page 404 : route inconnue. */
export default function NotFound() {
  return (
    <div className="px-6 pt-24 text-center space-y-3">
      <div className="text-5xl">🧭</div>
      <h1 className="text-2xl font-bold">Page introuvable</h1>
      <p className="text-muted">Cette page n'existe pas (ou plus).</p>
      <Link href="/" className="text-accent font-semibold inline-block">
        Retour à l'accueil →
      </Link>
    </div>
  );
}
