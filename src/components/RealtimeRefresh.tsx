"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Rafraîchit la page automatiquement dès qu'un score / statut de match change
 * dans le pool (temps réel Supabase). À poser sur les pages qui affichent les
 * scores (Calendrier) pour qu'elles se mettent à jour sans recharger.
 */
export function RealtimeRefresh({ poolId }: { poolId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`matches-live-${poolId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `pool_id=eq.${poolId}` },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_reactions", filter: `pool_id=eq.${poolId}` },
        () => router.refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [poolId, router]);

  return null;
}
