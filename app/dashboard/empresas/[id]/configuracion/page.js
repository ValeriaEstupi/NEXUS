import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmpresaRole } from "@/app/lib/empresaRole";
import EmpresaForm from "./EmpresaForm";
import MembersManager from "./MembersManager";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage({ params }) {
  const empresaId = params.id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ canEdit, canDelete }, { data: empresa }, { data: members }] = await Promise.all([
    getEmpresaRole(supabase, empresaId, user.id),
    supabase.from("empresas").select("*").eq("id", empresaId).single(),
    supabase
      .from("empresa_members")
      .select("user_id, role, joined_at, profiles(full_name, email)")
      .eq("empresa_id", empresaId)
      .order("joined_at"),
  ]);

  return (
    <div className="page-body">
      <h1>⚙️ Configuración</h1>
      <p className="page-intro">Datos de esta empresa y sus miembros.</p>

      {empresa && <EmpresaForm empresa={empresa} canEdit={canEdit} />}

      <MembersManager
        empresaId={empresaId}
        members={members || []}
        myId={user.id}
        canManage={canDelete}
      />
    </div>
  );
}
