// Cliente de Supabase para usar en el servidor (páginas y rutas que
// corren en Next.js, no en el navegador del usuario).
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se puede ignorar si esto se llama desde un Server Component;
            // el middleware ya se encarga de refrescar la sesión.
          }
        },
      },
    }
  );
}
