"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/Avatar";
import { X } from "lucide-react";

type Acc = { email: string; name: string };
const LS_KEY = "lagrille:accounts";

/** E-mail interne déterministe à partir du prénom + nom (jamais affiché). */
function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
function emailFrom(prenom: string, nom: string): string {
  return `${slug(prenom)}.${slug(nom)}@lagrille.app`;
}

export default function LoginPage() {
  const [accounts, setAccounts] = useState<Acc[]>([]);
  const [view, setView] = useState<"picker" | "login" | "signup">("login");
  const [locked, setLocked] = useState<Acc | null>(null); // profil tapé (email connu)
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let list: Acc[] = [];
    try {
      list = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {}
    setAccounts(list);
    setView(list.length ? "picker" : "signup");
  }, []);

  function remember(acc: Acc) {
    try {
      const list = (JSON.parse(localStorage.getItem(LS_KEY) || "[]") as Acc[]).filter(
        (a) => a.email !== acc.email
      );
      list.unshift(acc);
      localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 8)));
    } catch {}
  }

  function forget(email: string) {
    const list = accounts.filter((a) => a.email !== email);
    setAccounts(list);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(list));
    } catch {}
    if (!list.length) setView("signup");
  }

  function pickProfile(acc: Acc) {
    setLocked(acc);
    setPassword("");
    setError(null);
    setView("login");
  }

  function otherAccount() {
    setLocked(null);
    setPrenom("");
    setNom("");
    setPassword("");
    setError(null);
    setView("login");
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    if (view === "signup") {
      const email = emailFrom(prenom, nom);
      const displayName = `${prenom.trim()} ${nom.trim()}`.trim();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) {
        setLoading(false);
        if (error.message.toLowerCase().includes("already registered"))
          return setError("Ce prénom + nom a déjà un compte — connecte-toi.");
        if (error.message.toLowerCase().includes("at least"))
          return setError("Mot de passe : au moins 6 caractères.");
        return setError(error.message);
      }
      if (!data.session) {
        setLoading(false);
        return setError("Ce prénom + nom a déjà un compte — connecte-toi.");
      }
      remember({ email, name: displayName });
      window.location.assign("/");
      return;
    }

    // Connexion
    const email = locked ? locked.email : emailFrom(prenom, nom);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return setError("Mot de passe incorrect (ou compte inexistant).");
    }
    remember({ email, name: locked ? locked.name : `${prenom.trim()} ${nom.trim()}`.trim() });
    window.location.assign("/");
  }

  const canSubmit =
    password.length >= 6 && (view === "picker" ? false : locked ? true : prenom.trim() && nom.trim());

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 -mt-8">
      <div className="mb-8 text-center">
        <Image
          src="/icon-192.png"
          alt="La Grille"
          width={84}
          height={84}
          priority
          className="mx-auto mb-3 rounded-[22px] shadow-card"
        />
        <h1 className="text-3xl font-bold tracking-tight">La Grille</h1>
        <p className="text-muted mt-1">Le concours de pronos entre potes.</p>
      </div>

      {/* --- Choix du profil --- */}
      {view === "picker" && (
        <div className="space-y-3 animate-fade-up">
          <p className="text-center text-sm text-muted">Qui pronostique ?</p>
          <div className="space-y-2">
            {accounts.map((acc) => (
              <button
                key={acc.email}
                onClick={() => pickProfile(acc)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-3 shadow-card active:scale-[0.99] transition"
              >
                <Avatar url={null} name={acc.name} size={44} />
                <span className="min-w-0 flex-1 text-left font-semibold truncate">{acc.name}</span>
                <span
                  role="button"
                  aria-label="Oublier ce profil"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Oublier le profil de ${acc.name} ?`)) forget(acc.email);
                  }}
                  className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2"
                >
                  <X size={15} />
                </span>
              </button>
            ))}
          </div>
          <button onClick={otherAccount} className="w-full text-center text-sm text-accent font-medium pt-2">
            Se connecter avec un autre compte
          </button>
          <button
            onClick={() => {
              otherAccount();
              setView("signup");
            }}
            className="w-full text-center text-sm text-muted font-medium"
          >
            Créer un compte
          </button>
        </div>
      )}

      {/* --- Connexion --- */}
      {view === "login" && (
        <form onSubmit={submit} className="space-y-3 animate-fade-up">
          {locked ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2 px-3 py-3">
              <Avatar url={null} name={locked.name} size={40} />
              <span className="min-w-0 font-semibold truncate">{locked.name}</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Prénom"
                className="w-1/2 h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
              />
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Nom"
                className="w-1/2 h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
              />
            </div>
          )}
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="Mot de passe"
            autoFocus={!!locked}
            className="w-full h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
          />
          {error && <p className="text-sm text-[#ff3b30] px-1">{error}</p>}
          <Button type="submit" size="lg" disabled={!canSubmit || loading}>
            {loading ? "..." : "Se connecter"}
          </Button>
          <div className="flex items-center justify-between pt-1 text-sm">
            {accounts.length > 0 ? (
              <button type="button" onClick={() => setView("picker")} className="text-accent font-medium">
                ← Mes profils
              </button>
            ) : (
              <span />
            )}
            <button type="button" onClick={() => setView("signup")} className="text-muted font-medium">
              Créer un compte
            </button>
          </div>
        </form>
      )}

      {/* --- Création de compte --- */}
      {view === "signup" && (
        <form onSubmit={submit} className="space-y-3 animate-fade-up">
          <div className="flex gap-2">
            <input
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Prénom"
              className="w-1/2 h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
            />
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom"
              className="w-1/2 h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
            />
          </div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            placeholder="Mot de passe (6 caractères min.)"
            className="w-full h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
          />
          {error && <p className="text-sm text-[#ff3b30] px-1">{error}</p>}
          <Button type="submit" size="lg" disabled={!canSubmit || loading}>
            {loading ? "..." : "Créer mon compte"}
          </Button>
          <button
            type="button"
            onClick={() => setView(accounts.length ? "picker" : "login")}
            className="w-full text-center text-sm text-accent font-medium pt-1"
          >
            {accounts.length ? "← Mes profils" : "J'ai déjà un compte"}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-muted px-4 pt-5">
        Pas d&apos;e-mail : juste prénom, nom et mot de passe. Tu restes connecté,
        et tu peux revenir d&apos;un tap sur ton profil.
      </p>
    </div>
  );
}
