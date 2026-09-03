import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import CapacitacionRow from "./CapacitacionRow";
import NewCapacitacionForm from "./NewCapacitacionForm";

export const dynamic = "force-dynamic";

export default async function CapacitacionesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: capacitaciones }, { data: conductores }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("capacitaciones")
      .select("*, capacitacion_asistentes(conductor_id)")
      .order("fecha", { ascending: false }),
    supabase.from("conductores").select("id, nombre_completo").order("nombre_completo"),
  ]);

  const canEdit = profile?.role === "editor" || profile?.role === "super_admin";
  const canDelete = profile?.role === "super_admin";

  return (
    <div className="page-body">
      <h1>🎓 Capacitaciones</h1>
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

      {canEdit && <NewCapacitacionForm conductores={conductores || []} />}
    </div>
  );
}
