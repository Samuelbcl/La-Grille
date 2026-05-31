"use client";

import { Button } from "@/components/ui/button";

/** Boundary d'erreur global : évite l'écran blanc si une requête plante. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="px-6 pt-24 text-center space-y-4">
      <div className="text-5xl">😬</div>
      <h1 className="text-2xl font-bold">Oups, un souci</h1>
      <p className="text-muted">
        Quelque chose n'a pas fonctionné. Réessaie — si ça persiste, recharge la page.
      </p>
      <Button onClick={reset} className="mx-auto w-auto px-8">
        Réessayer
      </Button>
    </div>
  );
}
