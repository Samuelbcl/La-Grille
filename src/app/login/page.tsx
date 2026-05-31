"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendLink() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: { display_name: name || undefined },
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 -mt-12">
      <div className="mb-10 text-center">
        <div className="text-6xl mb-3">⚽️</div>
        <h1 className="text-3xl font-bold tracking-tight">La Grille</h1>
        <p className="text-muted mt-1">Le pari entre potes, sans Excel.</p>
      </div>

      {sent ? (
        <div className="rounded-2xl bg-surface border border-border p-6 text-center shadow-card animate-fade-up">
          <div className="text-4xl mb-2">📬</div>
          <p className="font-semibold">Lien envoyé !</p>
          <p className="text-sm text-muted mt-1">
            Ouvre l'e-mail reçu sur <b>{email}</b> et clique sur le lien pour te connecter.
          </p>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-up">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ton prénom"
            className="w-full h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            inputMode="email"
            placeholder="ton@email.com"
            className="w-full h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
          />
          {error && <p className="text-sm text-[#ff3b30] px-1">{error}</p>}
          <Button size="lg" disabled={!email || loading} onClick={sendLink}>
            {loading ? "Envoi..." : "Recevoir mon lien de connexion"}
          </Button>
          <p className="text-center text-xs text-muted px-4 pt-2">
            Pas de mot de passe : tu reçois un lien magique par e-mail.
          </p>
        </div>
      )}
    </div>
  );
}
