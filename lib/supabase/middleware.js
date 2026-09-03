import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Se ejecuta en cada visita: renueva la sesión del usuario y decide si
// puede entrar a páginas protegidas (como /dashboard) o si lo mandamos
// primero a /login.
export async function updateSession(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isOnLogin = request.nextUrl.pathname.startsWith("/login");

  if (isOnDashboard && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isOnLogin && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
