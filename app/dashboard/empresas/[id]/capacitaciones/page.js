import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmpresaRole } from "@/app/lib/empresaRole";
import { GraduationCapIcon } from "@/app/dashboard/Icons";
import CapacitacionRow from "./CapacitacionRow";
import NewCapacitacionForm from "./NewCapacitacionForm";

export const dynamic = "force-dynamic";

export default async function CapacitacionesPage({ params }) {
  const empresaId = params.id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ canEdit, canDelete }, { data: capacitaciones }, { data: conductores }] = await Promise.all([
    getEmpresaRole(supabase, empresaId, user.id),
    supabase
      .from("capacitaciones")
      .select("*, capacitacion_asistentes(conductor_id)")
      .eq("empresa_id", empresaId)
      .order("fecha", { ascending: false }),
    supabase.from("conductores").select("id, nombre_completo").eq("empresa_id", empresaId).order("nombre_completo"),
  ]);

  return (
    <div className="page-body">
      <h1 className="icon-heading"><GraduationCapIcon size={26} /> Capacitaciones</h1>
      <p className="page-intro">
        Capacitación en seguridad vial (PESV) y en SG-SST, con la lista de
        conductores que asistieron a cada una.
      </p>

      <section className="section-card">
        <h2>Registros ({capacitaciones?.length || 0})</h2>
        {capacitaciones && capacitaciones.length > 0 ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tema</th>
                  <th>Fecha</th>
                  <th>Horas</th>
                  <th>Asistentes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {capacitaciones.map((c) => (
                  <CapacitacionRow
                    key={c.id}
                    capacitacion={c}
                    empresaId={empresaId}
                    conductores={conductores || []}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Todavía no hay capacitaciones registradas.</p>
        )}
      </section>

      {canEdit && <NewCapacitacionForm empresaId={empresaId} conductores={conductores || []} />}
    </div>
  );
}
