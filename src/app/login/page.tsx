"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type Acc = { email: string; name: string };
const LS_KEY = "lagrille:accounts";

function traduire(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("at least") && m.includes("character")) return "Mot de passe : au moins 6 caractères.";
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "E-mail invalide.";
  if (m.includes("already registered")) return "Cet e-mail a déjà un compte — connecte-toi.";
  return msg;
}

/** Couleur d'avatar stable à partir du nom. */
function avatarColor(s: string): string {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 60% 45%)`;
}

export default function LoginPage() {
  const [accounts, setAccounts] = useState<Acc[]>([]);
  const [view, setView] = useState<"picker" | "login" | "signup">("login");
  const [emailLocked, setEmailLocked] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comptes mémorisés sur cet appareil.
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
      localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 6)));
    } catch {}
  }

  function forget(emailToRemove: string) {
    const list = accounts.filter((a) => a.email !== emailToRemove);
    setAccounts(list);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(list));
    } catch {}
    if (!list.length) setView("signup");
  }

  function pickProfile(acc: Acc) {
    setEmail(acc.email);
    setName(acc.name);
    setEmailLocked(true);
    setPassword("");
    setError(null);
    setView("login");
  }

  function otherAccount() {
    setEmail("");
    setName("");
    setEmailLocked(false);
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name.trim() || email.split("@")[0] } },
      });
      if (error) {
        setLoading(false);
        return setError(traduire(error.message));
      }
      if (!data.session) {
        setLoading(false);
        return setError("Cet e-mail a déjà un compte — connecte-toi.");
      }
      remember({ email, name: name.trim() || email.split("@")[0] });
      window.location.assign("/");
      return;
    }

    // Connexion
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return setError("Mot de passe incorrect (ou compte inexistant).");
    }
    // Récupère le prénom pour la carte de profil
    let displayName = name;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();
        displayName = prof?.display_name || name || email.split("@")[0];
      }
    } catch {}
    remember({ email, name: displayName });
    window.location.assign("/");
  }

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
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: avatarColor(acc.name || acc.email) }}
                >
                  {(acc.name || acc.email).charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block font-semibold truncate">{acc.name}</span>
                  <span className="block text-xs text-muted truncate">{acc.email}</span>
                </span>
                <span
                  role="button"
                  aria-label="Oublier ce profil"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Oublier le profil de ${acc.name || acc.email} ? Tu devras retaper l'e-mail pour revenir.`)) {
                      forget(acc.email);
                    }
                  }}
                  className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2"
                >
                  <X size={15} />
                </span>
              </button>
            ))}
          </div>

          <button onClick={otherAccount} className="w-full text-center text-sm text-accent font-medium pt-2">
            Utiliser un autre compte
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
          {emailLocked ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2 px-3 py-3">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-base font-bold text-white"
                style={{ backgroundColor: avatarColor(name || email) }}
              >
                {(name || email).charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold truncate">{name || "Connexion"}</span>
                <span className="block text-xs text-muted truncate">{email}</span>
              </span>
            </div>
          ) : (
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="ton@email.com"
              className="w-full h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
            />
          )}
          {/* champ email caché pour les gestionnaires de mots de passe quand il est verrouillé */}
          {emailLocked && <input type="email" value={email} autoComplete="email" readOnly hidden />}

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="Mot de passe"
            autoFocus={emailLocked}
            className="w-full h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
          />

          {error && <p className="text-sm text-[#ff3b30] px-1">{error}</p>}

          <Button type="submit" size="lg" disabled={!email || password.length < 6 || loading}>
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
            autoComplete="email"
            placeholder="ton@email.com"
            className="w-full h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            placeholder="Mot de passe (6 caractères min.)"
            className="w-full h-12 rounded-2xl border border-border bg-surface px-4 outline-none focus:border-accent"
          />

          {error && <p className="text-sm text-[#ff3b30] px-1">{error}</p>}

          <Button type="submit" size="lg" disabled={!email || password.length < 6 || loading}>
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
        Tes profils restent sur ton téléphone : si tu te déconnectes, tu n'as qu'à
        cliquer sur le tien pour revenir.
      </p>
    </div>
  );
}
