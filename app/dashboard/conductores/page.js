import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import ConductorRow from "./ConductorRow";
import NewConductorForm from "./NewConductorForm";

export const dynamic = "force-dynamic";

export default async function ConductoresPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: conductores }, { data: vehiculos }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase.from("conductores").select("*").order("nombre_completo"),
    supabase.from("vehiculos").select("id, placa").order("placa"),
  ]);

  const canEdit = profile?.role === "editor" || profile?.role === "super_admin";
  const canDelete = profile?.role === "super_admin";

  return (
    <div className="page-body">
      <h1>🪪 Conductores</h1>
      <p className="page-intro">
        Licencias, exámenes médicos y curso de conducción segura (Ley
        1503 de 2011) de cada conductor.
      </p>

      <section className="section-card">
        <h2>Conductores registrados ({conductores?.length || 0})</h2>
        {conductores && conductores.length > 0 ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Licencia</th>
                  <th>Examen médico</th>
                  <th>Vehículo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {conductores.map((c) => (
                  <ConductorRow
                    key={c.id}
                    conductor={c}
                    vehiculos={vehiculos || []}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Todavía no hay conductores registrados.</p>
        )}
      </section>

      {canEdit && <NewConductorForm vehiculos={vehiculos || []} />}
    </div>
  );
}
