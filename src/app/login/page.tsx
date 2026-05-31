"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/** Traduit les erreurs Supabase courantes en français clair. */
function traduire(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("at least") && m.includes("character"))
    return "Mot de passe : au moins 6 caractères.";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "E-mail invalide.";
  return msg;
}

export default function LoginPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enter() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // 1) On tente de se connecter.
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      const m = signInError.message.toLowerCase();
      if (m.includes("invalid login credentials")) {
        // 2) Pas de compte (ou mauvais mot de passe) → on tente de créer le compte.
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() || email.split("@")[0] } },
        });
        if (signUpError) {
          setLoading(false);
          if (signUpError.message.toLowerCase().includes("already registered"))
            return setError("Mot de passe incorrect pour cet e-mail.");
          return setError(traduire(signUpError.message));
        }
        if (!data.session) {
          // E-mail déjà utilisé (réponse masquée par Supabase) → donc mot de passe faux.
          setLoading(false);
          return setError("Mot de passe incorrect pour cet e-mail.");
        }
      } else {
        setLoading(false);
        return setError(traduire(signInError.message));
      }
    }

    // Connecté : rechargement complet pour que le serveur voie la session
    // (sinon on reste bloqué sur /login).
    window.location.assign("/");
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 -mt-12">
      <div className="mb-10 text-center">
        <div className="text-6xl mb-3">⚽️</div>
        <h1 className="text-3xl font-bold tracking-tight">La Grille</h1>
        <p className="text-muted mt-1">Le pari entre potes, sans Excel.</p>
      </div>

      <div className="space-y-3 animate-fade-up">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ton prénom (si c'est ta 1re fois)"
          className="w-full h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
        />
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
          autoComplete="current-password"
          placeholder="Mot de passe (6 caractères min.)"
          className="w-full h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
          onKeyDown={(e) => e.key === "Enter" && email && password.length >= 6 && enter()}
        />

        {error && <p className="text-sm text-[#ff3b30] px-1">{error}</p>}

        <Button size="lg" disabled={!email || password.length < 6 || loading} onClick={enter}>
          {loading ? "..." : "Entrer"}
        </Button>

        <p className="text-center text-xs text-muted px-4 pt-1">
          Première fois ? Ton compte se crée tout seul. Ensuite, même e-mail + mot de passe —
          et tu restes connecté, pas besoin de recommencer.
        </p>
      </div>
    </div>
  );
}
