"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    if (!confirm("Se déconnecter ? Tu pourras revenir en cliquant sur ton profil.")) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={signOut}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3.5 text-sm font-semibold text-[#ff3b30] active:scale-[0.99] transition"
    >
      <LogOut size={16} /> Se déconnecter
    </button>
  );
}
