import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ReglesPage() {
  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+14px)] space-y-5">
      <Link href="/" className="flex items-center gap-1 text-accent font-medium -ml-1">
        <ChevronLeft size={22} /> Retour
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">Comment ça marche</h1>

      <Card className="p-5 space-y-4 text-[15px] leading-relaxed">
        <div>
          <p className="font-semibold">🎯 Le principe</p>
          <p className="text-muted">
            Chacun pronostique le score de chaque match. Le participant avec le plus de
            points à la fin du tournoi gagne le classement (en cas d'égalité, ex æquo).
          </p>
        </div>
        <div className="h-px bg-border" />
        <div>
          <p className="font-semibold">🧮 Le barème (par phase)</p>
          <div className="mt-2 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-surface-2 text-muted">
                  <th className="text-left font-medium px-3 py-2">Phase</th>
                  <th className="text-right font-medium px-2 py-2 text-success">Exact</th>
                  <th className="text-right font-medium px-3 py-2 text-accent">Bon vainqueur</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {[
                  ["Phase de groupes", 5, 2],
                  ["16es de finale", 6, 3],
                  ["8es de finale", 8, 4],
                  ["Quarts de finale", 12, 6],
                  ["Demi-finales", 18, 9],
                  ["Finale", 30, 15],
                ].map(([phase, exact, bon]) => (
                  <tr key={phase as string} className="border-t border-border">
                    <td className="px-3 py-1.5">{phase}</td>
                    <td className="px-2 py-1.5 text-right font-semibold text-success">{exact}</td>
                    <td className="px-3 py-1.5 text-right font-semibold text-accent">{bon}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted text-[13px] mt-2">
            🎁 <b>+1 bonus</b> si un seul des deux scores est correct. On garde le
            meilleur cas : exact &gt; bon vainqueur &gt; +1 &gt; 0.
          </p>
        </div>
        <div className="h-px bg-border" />
        <div>
          <p className="font-semibold">🔒 Anti-triche</p>
          <p className="text-muted">
            Tu peux modifier ton prono jusqu'au coup d'envoi. Les pronos des autres
            joueurs ne deviennent visibles qu'une fois le match commencé.
          </p>
        </div>
        <div className="h-px bg-border" />
        <div>
          <p className="font-semibold">🏆 Le classement</p>
          <p className="text-muted">
            Il se met à jour <b>automatiquement</b> dès que l'organisateur saisit un
            résultat. Plus besoin de tout recompter à la main.
          </p>
        </div>
      </Card>
    </div>
  );
}
