import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

// Supabase manda al usuario aquí después de que confirma su correo
// (o usa un enlace mágico). Intercambiamos el código por una sesión
// y lo mandamos al panel.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
