// Calcula, para la persona que hace la consulta, su rol dentro de una
// empresa puntual: si es "app admin" (dueña de toda la plataforma)
// cuenta como admin de cualquier empresa, sin necesidad de que exista
// una fila en "empresa_members". Se usa en casi todas las pantallas
// que cuelgan de /dashboard/empresas/[id]/...
export async function getEmpresaRole(supabase, empresaId, userId) {
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("is_app_admin").eq("id", userId).single(),
    supabase
      .from("empresa_members")
      .select("role")
      .eq("empresa_id", empresaId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const isAppAdmin = !!profile?.is_app_admin;
  const role = membership?.role || (isAppAdmin ? "admin" : null);

  return {
    role,
    isAppAdmin,
    canEdit: isAppAdmin || role === "editor" || role === "admin",
    canDelete: isAppAdmin || role === "admin",
  };
}
