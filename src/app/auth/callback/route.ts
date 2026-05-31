import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback du lien magique : Supabase renvoie ici avec un `?code=...` (flux PKCE).
 * On l'échange contre une session (pose les cookies), puis on redirige vers l'accueil.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Lien invalide ou expiré → retour au login.
  return NextResponse.redirect(`${origin}/login?error=lien_invalide`);
}
