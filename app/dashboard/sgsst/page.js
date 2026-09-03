import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { withSignedUrls } from "../../lib/evidencias";
import ChecklistItem from "../ChecklistItem";
import AddEstandarForm from "./AddEstandarForm";

export const dynamic = "force-dynamic";

export default async function SgsstPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: fases }, { data: estandares }, { data: avanceRows }, { data: profiles }] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase.from("fases_phva").select("id, orden, nombre").order("orden"),
      supabase
        .from("estandares_sgsst")
        .select(
          "id, fase_id, componente, codigo, descripcion, puntaje, orden, activo, cumplimiento_items(id, estado, responsable_id, fecha_limite, observaciones, evidencias(id, nombre_archivo, ruta_storage))"
        )
        .order("orden"),
      supabase.from("v_avance_sgsst").select("*"),
      supabase.from("profiles").select("id, full_name, email").order("full_name"),
    ]);

  const canEdit = profile?.role === "editor" || profile?.role === "super_admin";
  const canDelete = profile?.role === "super_admin";
  const avance = avanceRows?.[0] || { porcentaje_avance: 0, puntaje_obtenido: 0, puntaje_aplicable: 0 };

  const flatItems = (estandares || []).map((e) => ({
    ...e.cumplimiento_items?.[0],
    _estandar: e,
  }));
  const withUrls = await withSignedUrls(supabase, flatItems);

  return (
    <div className="page-body">
      <h1>🦺 Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST)</h1>
      <p className="page-intro">
        Estándares mínimos según la Resolución 0312 de 2019, organizados por
        el ciclo PHVA. Perfil configurado: empresa grande (50+ vehículos
        y/o trabajadores) — set completo de estándares.
      </p>

      <div className="disclaimer-box">
        ⚖️ Esta plantilla de estándares y puntajes es un punto de partida
        editable, no un texto legal certificado. Valídala contra el texto
        vigente de la resolución y el grupo de estándares que realmente
        aplica a tu empresa (según ARL y número de trabajadores) antes de
        una auditoría.
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Calificación SG-SST</div>
          <div className="stat-value">{avance.porcentaje_avance}%</div>
          <div className="stat-sub">
            {avance.puntaje_obtenido} de {avance.puntaje_aplicable} puntos aplicables
          </div>
        </div>
      </div>

      {(fases || []).map((fase) => {
        const items = withUrls.filter((i) => i._estandar.fase_id === fase.id);
        if (items.length === 0) return null;

        return (
          <section key={fase.id} className="section-card">
            <h2>{fase.orden}. {fase.nombre}</h2>

            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "40%" }}>Estándar</th>
                    <th>Estado</th>
                    <th>Responsable</th>
                    <th>Fecha límite</th>
                    <th>Evidencia</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <ChecklistItem
                      key={item.id}
                      item={item}
                      meta={{
                        tipo: "sgsst",
                        id: item._estandar.id,
                        codigo: item._estandar.codigo,
                        descripcion: item._estandar.descripcion,
                        sub: `${item._estandar.componente} · ${item._estandar.puntaje} pts`,
                        componente: item._estandar.componente,
                        puntaje: item._estandar.puntaje,
                        faseId: item._estandar.fase_id,
                        activo: item._estandar.activo,
                      }}
                      profiles={profiles || []}
                      fases={fases || []}
                      canEdit={canEdit}
                      canDelete={canDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {canEdit && <AddEstandarForm faseId={fase.id} />}
          </section>
        );
      })}
    </div>
  );
}
