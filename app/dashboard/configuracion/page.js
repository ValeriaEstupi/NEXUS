import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import EmpresaForm from "./EmpresaForm";
import UsuariosTable from "./UsuariosTable";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: empresa }, { data: usuarios }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase.from("empresa").select("*").limit(1).single(),
    supabase.from("profiles").select("id, full_name, email, role").order("created_at"),
  ]);

  const canEdit = profile?.role === "editor" || profile?.role === "super_admin";
  const canManageUsers = profile?.role === "super_admin";

  return (
    <div className="page-body">
      <h1>⚙️ Configuración</h1>
      <p className="page-intro">
        Datos de la empresa y administración de usuarios de NEXU.
      </p>

      {empresa && <EmpresaForm empresa={empresa} canEdit={canEdit} />}

      <UsuariosTable usuarios={usuarios || []} myId={user.id} canManage={canManageUsers} />
    </div>
  );
}
