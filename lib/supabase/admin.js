import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente "administrador": usa la clave secreta de Supabase (nunca la
// pública) y por eso NUNCA se debe importar desde un componente de
// navegador — solo desde código que corre en el servidor. Se usa para
// generar enlaces de descarga seguros y temporales ("signed URLs") de
// las evidencias guardadas en Storage, que vive en un bucket privado.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
