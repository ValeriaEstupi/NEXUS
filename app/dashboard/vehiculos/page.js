import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import VehiculoRow from "./VehiculoRow";
import NewVehiculoForm from "./NewVehiculoForm";

export const dynamic = "force-dynamic";

export default async function VehiculosPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: vehiculos }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase.from("vehiculos").select("*").order("placa"),
  ]);

  const canEdit = profile?.role === "editor" || profile?.role === "super_admin";
  const canDelete = profile?.role === "super_admin";

  return (
    <div className="page-body">
      <h1>🚐 Vehículos</h1>
      <p className="page-intro">
        Flota de la empresa: documentos vigentes, mantenimiento y estado
        operativo de cada vehículo.
      </p>

      <section className="section-card">
        <h2>Flota registrada ({vehiculos?.length || 0})</h2>
        {vehiculos && vehiculos.length > 0 ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Estado</th>
                  <th>SOAT</th>
                  <th>Tecnomecánica</th>
                  <th>Próx. mantenimiento</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vehiculos.map((v) => (
                  <VehiculoRow key={v.id} vehiculo={v} canEdit={canEdit} canDelete={canDelete} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Todavía no hay vehículos registrados.</p>
        )}
      </section>

      {canEdit && <NewVehiculoForm />}
    </div>
  );
}
