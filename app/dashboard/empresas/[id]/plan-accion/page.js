import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmpresaRole } from "@/app/lib/empresaRole";
import PlanAccionRow from "./PlanAccionRow";
import NewPlanAccionForm from "./NewPlanAccionForm";

export const dynamic = "force-dynamic";

export default async function PlanAccionPage({ params }) {
  const empresaId = params.id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ canEdit, canDelete }, { data: planes }, { data: incidentes }, { data: profiles }] = await Promise.all([
    getEmpresaRole(supabase, empresaId, user.id),
    supabase
      .from("plan_accion")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("fecha_limite", { ascending: true, nullsFirst: false }),
    supabase.from("incidentes").select("id, fecha, descripcion").eq("empresa_id", empresaId).order("fecha", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
  ]);

  return (
    <div className="page-body">
      <h1>✅ Planes de acción</h1>
      <p className="page-intro">
        Acciones correctivas y preventivas que nacen de un incidente, una
        auditoría o un hallazgo de cumplimiento.
      </p>

      <section className="section-card">
        <h2>Acciones ({planes?.length || 0})</h2>
        {planes && planes.length > 0 ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Origen</th>
                  <th>Responsable</th>
                  <th>Fecha límite</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {planes.map((p) => (
                  <PlanAccionRow
                    key={p.id}
                    plan={p}
                    empresaId={empresaId}
                    incidentes={incidentes || []}
                    profiles={profiles || []}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Todavía no hay acciones registradas.</p>
        )}
      </section>

      {canEdit && <NewPlanAccionForm empresaId={empresaId} incidentes={incidentes || []} profiles={profiles || []} />}
    </div>
  );
}
