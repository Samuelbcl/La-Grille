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
          <p className="font-semibold">🧮 Le barème</p>
          <ul className="text-muted space-y-1.5 mt-2">
            <li>
              <b className="text-accent">Bon vainqueur</b> (victoire / nul / défaite) :{" "}
              <b className="text-text">+2</b>
            </li>
            <li>
              <b className="text-success">Score exact</b> : <b className="text-text">+5 en plus</b> →{" "}
              <b className="text-text">7 points</b> au total 🎯
            </li>
            <li>
              <b>Mauvais vainqueur</b>, ou <b>oubli de parier</b> : <b className="text-text">0</b>
            </li>
          </ul>
          <p className="text-muted text-[13px] mt-2">
            Les points sont les mêmes à toutes les phases. Un score exact cumule le bon vainqueur
            (2) et l&apos;exact (5).
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
            Il se met à jour <b>automatiquement</b> dès qu'un match est terminé (résultats
            officiels). Plus besoin de tout recompter à la main.
          </p>
        </div>
      </Card>
    </div>
  );
}
