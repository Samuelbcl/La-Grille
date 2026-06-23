"use client";

import { useEffect, useState } from "react";

/** Compte à rebours en direct jusqu'à `to` (ISO). Affiche "clôturé" une fois passé. */
export function Countdown({ to, className }: { to: string; className?: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null); // null au 1er rendu → évite le mismatch SSR

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return <span className={className}>…</span>;
  const ms = target - now;
  if (ms <= 0) return <span className={className}>clôturé</span>;

  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const text = d > 0 ? `${d}j ${h}h ${m}min` : h > 0 ? `${h}h ${m}min ${sec}s` : `${m}min ${sec}s`;

  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}
