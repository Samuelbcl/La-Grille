"use client";

import { useEffect, useRef, useState } from "react";
import { MatchCard, type MatchCardData } from "@/components/MatchCard";

export type CalDay = {
  day: string; // identifiant de jour "AAAA-MM-JJ" (Paris) — clé/sélection
  chipTop: string; // "Auj." ou "ven"
  chipBottom: string; // "19/06"
  title: string; // "Aujourd'hui" / "Demain" / "vendredi 19 juin"
  isToday: boolean;
  matches: MatchCardData[];
};

/** Calendrier façon Flashscore : barre de jours horizontale + matchs du jour choisi. */
export function CalendarView({
  days,
  userId,
  defaultDay,
}: {
  days: CalDay[];
  userId: string | null;
  defaultDay: string;
}) {
  const [selected, setSelected] = useState(defaultDay);
  const stripRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Centre le jour actif dans la barre (sans bouger la page).
  useEffect(() => {
    const strip = stripRef.current;
    const chip = activeRef.current;
    if (!strip || !chip) return;
    const s = strip.getBoundingClientRect();
    const c = chip.getBoundingClientRect();
    strip.scrollLeft += c.left - s.left - (s.width - c.width) / 2;
  }, [selected]);

  const cur = days.find((d) => d.day === selected) ?? days[0];

  return (
    <div className="py-4">
      {/* Barre de jours */}
      <div ref={stripRef} className="no-scrollbar mb-4 flex gap-2 overflow-x-auto px-4">
        {days.map((d) => {
          const active = d.day === selected;
          return (
            <button
              key={d.day}
              ref={active ? activeRef : undefined}
              onClick={() => setSelected(d.day)}
              className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-1.5 transition active:scale-95 ${
                active
                  ? "border-accent bg-accent text-accent-fg"
                  : d.isToday
                    ? "border-accent text-accent"
                    : "border-border bg-surface text-muted"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase leading-tight">{d.chipTop}</span>
              <span className="text-[13px] font-bold tabular-nums leading-tight">{d.chipBottom}</span>
            </button>
          );
        })}
      </div>

      {/* Matchs du jour sélectionné */}
      <div className="px-4">
        <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">{cur?.title}</h2>
        <div className="space-y-2.5">
          {cur?.matches.map((m) => (
            <MatchCard key={m.id} m={m} userId={userId} />
          ))}
        </div>
      </div>
    </div>
  );
}
