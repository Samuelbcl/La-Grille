"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/** Traduit les erreurs Supabase courantes en français clair. */
function traduire(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Cet e-mail a déjà un compte — passe en « Se connecter ».";
  if (m.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("at least") && m.includes("character"))
    return "Mot de passe : au moins 6 caractères.";
  if (m.includes("unable to validate email")) return "E-mail invalide.";
  return msg;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name.trim() || email.split("@")[0] } },
      });
      setLoading(false);
      if (error) return setError(traduire(error.message));
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError(traduire(error.message));
    }
    router.push("/");
    router.refresh();
  }

  const isSignup = mode === "signup";

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 -mt-12">
      <div className="mb-10 text-center">
        <div className="text-6xl mb-3">⚽️</div>
        <h1 className="text-3xl font-bold tracking-tight">La Grille</h1>
        <p className="text-muted mt-1">Le pari entre potes, sans Excel.</p>
      </div>

      <div className="space-y-3 animate-fade-up">
        {isSignup && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ton prénom"
            className="w-full h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="ton@email.com"
          className="w-full h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder="Mot de passe (6 caractères min.)"
          className="w-full h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
          onKeyDown={(e) => e.key === "Enter" && email && password && submit()}
        />

        {error && <p className="text-sm text-[#ff3b30] px-1">{error}</p>}

        <Button
          size="lg"
          disabled={!email || password.length < 6 || loading}
          onClick={submit}
        >
          {loading ? "..." : isSignup ? "Créer mon compte" : "Se connecter"}
        </Button>

        <button
          type="button"
          onClick={() => {
            setMode(isSignup ? "signin" : "signup");
            setError(null);
          }}
          className="w-full text-center text-sm text-accent font-medium pt-2"
        >
          {isSignup ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? En créer un"}
        </button>

        <p className="text-center text-xs text-muted px-4 pt-1">
          Pas de mail de confirmation : ton compte est actif tout de suite.
        </p>
      </div>
    </div>
  );
}
