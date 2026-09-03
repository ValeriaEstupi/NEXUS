import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmpresaRole } from "@/app/lib/empresaRole";
import { AlertTriangleIcon } from "@/app/dashboard/Icons";
import IncidenteRow from "./IncidenteRow";
import NewIncidenteForm from "./NewIncidenteForm";

export const dynamic = "force-dynamic";

export default async function IncidentesPage({ params }) {
  const empresaId = params.id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ canEdit, canDelete }, { data: incidentes }, { data: vehiculos }, { data: conductores }] =
    await Promise.all([
      getEmpresaRole(supabase, empresaId, user.id),
      supabase.from("incidentes").select("*").eq("empresa_id", empresaId).order("fecha", { ascending: false }),
      supabase.from("vehiculos").select("id, placa").eq("empresa_id", empresaId).order("placa"),
      supabase.from("conductores").select("id, nombre_completo").eq("empresa_id", empresaId).order("nombre_completo"),
    ]);

  return (
    <div className="page-body">
      <h1 className="icon-heading"><AlertTriangleIcon size={26} /> Incidentes y accidentes</h1>
      <p className="page-intro">
        Registro y seguimiento de accidentes de tránsito y accidentes o
        incidentes de trabajo. Cualquier persona de la empresa puede
        reportar uno; solo editores pueden investigarlo y cerrarlo.
      </p>

      <section className="section-card">
        <h2>Registros ({incidentes?.length || 0})</h2>
        {incidentes && incidentes.length > 0 ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Clasificación</th>
                  <th>Vehículo / conductor</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {incidentes.map((i) => (
                  <IncidenteRow
                    key={i.id}
                    incidente={i}
                    empresaId={empresaId}
                    vehiculos={vehiculos || []}
                    conductores={conductores || []}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Todavía no hay incidentes registrados. Ojalá siga así.</p>
        )}
      </section>

      <NewIncidenteForm empresaId={empresaId} vehiculos={vehiculos || []} conductores={conductores || []} />
    </div>
  );
}
