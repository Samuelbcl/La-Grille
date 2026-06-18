import Link from "next/link";
import { getCurrentPool, getMatchesWithPredictions } from "@/lib/queries";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { LiveBanner } from "@/components/LiveBanner";
import { CalendarView, type CalDay } from "@/components/CalendarView";
import { dayKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CalendrierPage() {
  const pool = await getCurrentPool();

  if (!pool) {
    return (
      <div className="px-6 pt-24 text-center">
        <div className="text-5xl mb-4">⚽️</div>
        <h1 className="text-2xl font-bold">Bienvenue !</h1>
        <p className="text-muted mt-2 mb-6">
          Crée ton groupe de pronos, ou rejoins celui de tes potes avec un code,
          depuis l&apos;onglet <b>Groupe</b>.
        </p>
        <Link
          href="/admin"
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-6 font-semibold text-accent-fg shadow-card active:scale-[0.98] transition"
        >
          Créer ou rejoindre un groupe →
        </Link>
      </div>
    );
  }

  const matches = await getMatchesWithPredictions(pool.id, pool.user_id);
  const live = matches.filter((m) => m.status === "live");

  // Regroupe par jour (minuit local) pour la barre de jours.
  const dayStart = (iso: string) => {
    const d = new Date(iso);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  const groups = new Map<number, typeof matches>();
  for (const m of matches) {
    const k = dayStart(m.kickoff);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(m);
  }
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const tomorrowStart = todayStart + 86_400_000;

  const days: CalDay[] = [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, list]) => {
      const d0 = new Date(list[0].kickoff);
      const isToday = day === todayStart;
      const wd = d0.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
      return {
        day,
        isToday,
        chipTop: isToday ? "Auj." : wd,
        chipBottom: d0.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        title: isToday ? "Aujourd'hui" : day === tomorrowStart ? "Demain" : dayKey(list[0].kickoff),
        matches: list,
      };
    });

  // Jour par défaut : aujourd'hui, sinon le prochain à venir, sinon le dernier.
  const defaultDay =
    days.find((d) => d.day === todayStart)?.day ??
    days.find((d) => d.day > todayStart)?.day ??
    days[days.length - 1]?.day ??
    0;

  return (
    <>
      <RealtimeRefresh poolId={pool.id} />
      <header className="app-header sticky top-0 z-30 px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-[22px] font-bold tracking-tight">{pool.name}</h1>
          <Link href="/regles" className="text-sm text-accent font-medium">
            Règles
          </Link>
        </div>
        <p className="text-[13px] text-muted">Calendrier &amp; résultats</p>
      </header>

      <LiveBanner matches={live} />

      {days.length === 0 ? (
        <p className="px-4 pt-16 text-center text-muted">
          Aucun match pour l&apos;instant. L&apos;organisateur peut les charger dans <b>Groupe</b>.
        </p>
      ) : (
        <CalendarView days={days} userId={pool.user_id} defaultDay={defaultDay} />
      )}

      {matches.length > 0 && !matches.some((m) => m.stage !== "group") && (
        <div className="mx-4 mb-4 rounded-2xl border border-dashed border-border bg-surface-2 p-5 text-center">
          <div className="mb-1 text-3xl">🏆</div>
          <p className="font-semibold">Phase finale — bientôt</p>
          <p className="mt-0.5 text-[13px] text-muted">
            16es de finale → finale. Les affiches apparaîtront ici <b>automatiquement</b> dès la fin
            des poules.
          </p>
        </div>
      )}
    </>
  );
}
